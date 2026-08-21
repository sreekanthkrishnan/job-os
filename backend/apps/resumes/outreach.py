import os
import re
import json
import logging
from typing import Dict, Any, List
from django.conf import settings
from apps.resumes.models import OutreachMessage, OutreachChannel, OutreachTone, Resume
from apps.jobs.models import Job

logger = logging.getLogger(__name__)

def generate_outreach_content(
    user,
    job: Job,
    resume: Resume = None,
    channel: str = OutreachChannel.EMAIL,
    tone: str = OutreachTone.PROFESSIONAL,
    recipient_name: str = "",
    recipient_role: str = "",
    modifier: str = ""  # "shorter", "direct", "technical"
) -> OutreachMessage:
    """
    Generates personalized Cold Email or LinkedIn outreach message using Google Gemini.
    Strictly avoids AI buzzwords and never fabricates candidate qualifications.
    """
    candidate_name = f"{user.first_name} {user.last_name}".strip() or user.email.split('@')[0]
    resume_parsed = resume.parsed_data if (resume and resume.parsed_data) else {}
    candidate_skills = resume_parsed.get("skills", [])
    candidate_experience = resume_parsed.get("professional_summary", "")

    api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
    if not api_key:
        from dotenv import load_dotenv
        load_dotenv(settings.BASE_DIR / '.env', override=True)
        load_dotenv(settings.BASE_DIR.parent / '.env', override=True)
        api_key = os.getenv('GEMINI_API_KEY', '')

    fallback_email = {
        "subject_lines": [
            f"Application for {job.role} - {candidate_name}",
            f"{job.role} Role | {candidate_name}",
            f"Interested in {job.role} at {job.company}"
        ],
        "selected_subject": f"Application for {job.role} - {candidate_name}",
        "body": f"Hi {recipient_name or 'Hiring Manager'},\n\nI am writing to express my strong interest in the {job.role} role at {job.company}. With experience in {', '.join(candidate_skills[:3]) if candidate_skills else 'software engineering'}, I am confident in my ability to contribute effectively to your team.\n\nI would welcome the opportunity to discuss how my background aligns with {job.company}'s goals.\n\nBest regards,\n{candidate_name}"
    }

    fallback_linkedin = {
        "subject_lines": ["Connection Request"],
        "selected_subject": "Connection Request",
        "body": f"Hi {recipient_name or 'there'}, I noticed {job.company} is hiring a {job.role}. Having worked with {', '.join(candidate_skills[:2]) if candidate_skills else 'tech'}, I'd love to connect and learn more about the team's engineering goals! Best, {candidate_name}"
    }

    result_data = fallback_linkedin if channel == OutreachChannel.LINKEDIN else fallback_email

    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)

            channel_str = "LinkedIn Message (concise under 150 words)" if channel == OutreachChannel.LINKEDIN else "Cold Email"
            modifier_instruction = f"Make the tone strictly {modifier}." if modifier else f"Tone: {tone}."

            prompt = f"""
You are an expert Executive Career Copywriter. Generate a high-converting, personalized {channel_str} for a job application.

CRITICAL RULES:
- Never use generic AI buzzwords like 'spearheaded', 'delve', 'synergy', 'passionate tech enthusiast'.
- Keep it human, direct, professional, and authentic.
- NEVER fabricate candidate experience or credentials not present in the candidate summary.
- Include a clear, non-pushy Call-To-Action (CTA).
- {modifier_instruction}

Context:
Candidate Name: {candidate_name}
Target Role: {job.role}
Target Company: {job.company}
Job Location: {job.location or 'Remote'}
Recipient Name: {recipient_name or 'Hiring Team'}
Recipient Role: {recipient_role or 'Hiring Manager / Recruiter'}
Candidate Key Skills: {', '.join(candidate_skills[:5])}
Candidate Summary: {candidate_experience[:300]}

Return structured JSON with exact keys:
- subject_lines (array of 3 punchy email subject lines)
- selected_subject (string - best recommended subject line)
- body (string - full email/message body with paragraph spacing)

Return ONLY valid JSON without markdown formatting or code fences.
"""

            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt
            )

            text_content = response.text.strip()
            if text_content.startswith("```"):
                text_content = re.sub(r'^```(?:json)?\n', '', text_content)
                text_content = re.sub(r'\n```$', '', text_content)

            gemini_out = json.loads(text_content)
            result_data["subject_lines"] = gemini_out.get("subject_lines", result_data["subject_lines"])
            result_data["selected_subject"] = gemini_out.get("selected_subject", result_data["selected_subject"])
            result_data["body"] = gemini_out.get("body", result_data["body"])

        except Exception as e:
            logger.warning(f"Gemini outreach generation failed ({e}). Returning fallback template.")

    outreach_obj = OutreachMessage.objects.create(
        user=user,
        job=job,
        resume=resume,
        channel=channel,
        tone=tone,
        recipient_name=recipient_name,
        recipient_role=recipient_role,
        subject_lines=result_data.get("subject_lines", []),
        selected_subject=result_data.get("selected_subject", ""),
        body=result_data.get("body", "")
    )

    return outreach_obj

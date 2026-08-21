import os
import re
import json
import logging
from typing import Dict, Any
from django.conf import settings
from apps.resumes.models import Resume, ResumeOptimization
from apps.resumes.scorer import score_resume_against_job

logger = logging.getLogger(__name__)

def optimize_resume_for_job(resume: Resume, job) -> ResumeOptimization:
    """
    Analyzes resume against job description and generates truthful optimization recommendations.
    Never invents experience or skills.
    """
    raw_text = resume.raw_text or ""
    parsed = resume.parsed_data or {}
    job_skills = list(job.job_skills.values_list('skill_name', flat=True))
    job_desc = job.raw_description or ""

    # Calculate current score
    scores = score_resume_against_job(
        resume_parsed=parsed,
        raw_resume_text=raw_text,
        job_role=job.role,
        job_description=job_desc,
        job_skills=job_skills,
        job_exp_required=job.experience_required or "",
        target_role=resume.target_role or ""
    )

    current_score = float(scores["suitability_score"])
    missing_skills = scores["missing_skills"]

    potential_improvement = round(min(15.0, len(missing_skills) * 3.5 + 4.0), 2)
    potential_score = round(min(100.0, current_score + potential_improvement), 2)

    api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
    if not api_key:
        from dotenv import load_dotenv
        load_dotenv(settings.BASE_DIR / '.env', override=True)
        load_dotenv(settings.BASE_DIR.parent / '.env', override=True)
        api_key = os.getenv('GEMINI_API_KEY', '')

    fallback_opt = {
        "missing_keywords": missing_skills[:5],
        "weak_sections": ["Professional Summary", "Technical Skills Highlight"],
        "suggested_improvements": [
            f"If you have actual hands-on experience with {sk}, explicitly list it under relevant projects or skills."
            for sk in missing_skills[:3]
        ] or ["Emphasize quantifiable achievements with metrics in recent roles."],
        "ats_formatting_concerns": ["Ensure bullet points start with strong action verbs.", "Use standard section headers like Work Experience."]
    }

    if api_key:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)

            prompt = f"""
You are an expert AI Resume Coach. Analyze this candidate's resume for the target job and provide TRUTHFUL, non-fabricating optimization suggestions.

IMPORTANT SAFETY RULE:
NEVER fabricate experience, skills, years of experience, or projects.
If a skill is missing, suggest: "If you have used X, consider adding it." Never instruct to invent experience.

Target Job:
Role: {job.role}
Company: {job.company}
Required Skills: {', '.join(job_skills)}
Description: {job_desc}

Resume Summary:
Name: {parsed.get('candidate_name', 'Candidate')}
Target Role: {resume.target_role}
Current Summary: {parsed.get('professional_summary', '')}
Extracted Skills: {', '.join(parsed.get('skills', []))}

Return structured JSON with exact keys:
- missing_keywords (array of 3-6 important missing technical/domain keywords)
- weak_sections (array of section names that need better alignment, e.g. Professional Summary, Achievements)
- suggested_improvements (array of 3-5 specific, actionable, truthful recommendations)
- ats_formatting_concerns (array of 2-3 ATS parse optimization tips)

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

            gemini_opt = json.loads(text_content)
            fallback_opt.update(gemini_opt)
        except Exception as e:
            logger.warning(f"Gemini resume optimization failed ({e}). Using fallback.")

    optimization_obj = ResumeOptimization.objects.create(
        resume=resume,
        job=job,
        current_score=current_score,
        potential_score=potential_score,
        potential_improvement=potential_improvement,
        missing_keywords=fallback_opt.get("missing_keywords", []),
        weak_sections=fallback_opt.get("weak_sections", []),
        suggested_improvements=fallback_opt.get("suggested_improvements", []),
        ats_formatting_concerns=fallback_opt.get("ats_formatting_concerns", [])
    )

    return optimization_obj

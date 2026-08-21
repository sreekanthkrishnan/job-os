import os
import re
import json
import logging
from typing import Dict, Any, List
from django.conf import settings
from apps.resumes.models import Resume, ResumeJobAnalysis
from apps.resumes.scorer import score_resume_against_job

logger = logging.getLogger(__name__)

def generate_qualitative_match_analysis(
    resume_parsed: Dict[str, Any],
    raw_resume_text: str,
    job_role: str,
    job_company: str,
    job_description: str,
    deterministic_scores: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Uses Google Gemini AI to generate qualitative match reasoning, strengths, weaknesses,
    evidence, risks, and estimated interview call probability.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
    if not api_key:
        from dotenv import load_dotenv
        load_dotenv(settings.BASE_DIR / '.env', override=True)
        load_dotenv(settings.BASE_DIR.parent / '.env', override=True)
        api_key = os.getenv('GEMINI_API_KEY', '')

    suitability = deterministic_scores["suitability_score"]
    skill_score = deterministic_scores["skill_match_score"]
    matching_skills = deterministic_scores["matching_skills"]
    missing_skills = deterministic_scores["missing_skills"]

    # Fallback qualitative analysis if Gemini is unavailable
    fallback_result = {
        "ai_call_probability_estimate": int(min(95, max(15, suitability * 0.8 + 10))),
        "ai_confidence": "Medium",
        "strengths": [f"Strong overlap in {len(matching_skills)} skills: {', '.join(matching_skills[:4])}"],
        "weaknesses": [f"Missing required skills: {', '.join(missing_skills[:3])}"] if missing_skills else ["No major skill gaps identified."],
        "evidence": [f"Candidate experience matches {job_role} profile requirements."],
        "risks": [f"Missing keywords: {', '.join(missing_skills[:2])}"] if missing_skills else [],
        "why_reasoning": [f"{suitability}% overall suitability based on skill coverage and experience."]
    }

    if not api_key:
        return fallback_result

    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an expert AI Career Copilot. Analyze the match between a candidate's resume profile and a target job.

Target Job:
Role: {job_role}
Company: {job_company}
Description: {job_description}

Calculated Suitability Score: {suitability}%
Skill Match Score: {skill_score}%
Matching Skills: {', '.join(matching_skills)}
Missing Skills: {', '.join(missing_skills)}

Candidate Resume Summary:
Name: {resume_parsed.get('candidate_name', 'Candidate')}
Seniority: {resume_parsed.get('seniority_level', 'Mid')}
Years Experience: {resume_parsed.get('years_of_experience', 3)}
Summary: {resume_parsed.get('professional_summary', '')}

Evaluate and return structured JSON with these exact keys:
- ai_call_probability_estimate (number 0 to 100, an ESTIMATED probability of getting an interview call)
- ai_confidence ("Low", "Medium", "High")
- strengths (array of 3-4 specific string bullet points highlighting candidate strengths for this role)
- weaknesses (array of 2-3 specific string bullet points highlighting resume gaps)
- evidence (array of 2-3 specific string bullet points referencing evidence in the resume)
- risks (array of 2-3 specific string bullet points showing risk factors for this application)
- why_reasoning (array of 2-3 string bullet points explaining why the probability estimate was given)

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

        parsed = json.loads(text_content)
        return parsed

    except Exception as e:
        logger.warning(f"Gemini match explanation failed ({e}). Returning fallback.")
        fallback_result["ai_error"] = str(e)
        return fallback_result


def analyze_resumes_for_job(user, job) -> List[ResumeJobAnalysis]:
    """
    Compares all active resumes belonging to the user against a given Job.
    Calculates deterministic scores, invokes Gemini for qualitative analysis,
    saves ResumeJobAnalysis records, and flags the 🏆 Best Recommended Resume.
    """
    active_resumes = list(Resume.objects.filter(user=user, is_active=True))
    if not active_resumes:
        return []

    # Get job skills
    job_skills = list(job.job_skills.values_list('skill_name', flat=True))
    job_desc = job.raw_description or ""

    analyses = []
    best_score = -1.0
    best_analysis_id = None

    for resume in active_resumes:
        raw_text = resume.raw_text or ""
        parsed = resume.parsed_data or {}

        # 1. Deterministic scoring
        scores = score_resume_against_job(
            resume_parsed=parsed,
            raw_resume_text=raw_text,
            job_role=job.role,
            job_description=job_desc,
            job_skills=job_skills,
            job_exp_required=job.experience_required or "",
            target_role=resume.target_role or ""
        )

        # 2. Qualitative Gemini analysis
        qualitative = generate_qualitative_match_analysis(
            resume_parsed=parsed,
            raw_resume_text=raw_text,
            job_role=job.role,
            job_company=job.company,
            job_description=job_desc,
            deterministic_scores=scores
        )

        suitability = scores["suitability_score"]

        # 3. Create or update analysis record
        analysis_obj, created = ResumeJobAnalysis.objects.update_or_create(
            resume=resume,
            job=job,
            defaults={
                "suitability_score": suitability,
                "skill_match_score": scores["skill_match_score"],
                "experience_match_score": scores["experience_match_score"],
                "role_match_score": scores["role_match_score"],
                "seniority_match_score": scores["seniority_match_score"],
                "keyword_score": scores["keyword_score"],
                "domain_score": scores["domain_score"],
                "ats_score": scores["ats_score"],
                "ai_call_probability_estimate": qualitative.get("ai_call_probability_estimate", 50),
                "ai_confidence": qualitative.get("ai_confidence", "Medium"),
                "matching_skills": scores["matching_skills"],
                "missing_skills": scores["missing_skills"],
                "strengths": qualitative.get("strengths", []),
                "weaknesses": qualitative.get("weaknesses", []),
                "evidence": qualitative.get("evidence", []),
                "analysis_json": {
                    "risks": qualitative.get("risks", []),
                    "why_reasoning": qualitative.get("why_reasoning", []),
                },
                "is_recommended": False,
            }
        )

        if suitability > best_score:
            best_score = suitability
            best_analysis_id = analysis_obj.id

        analyses.append(analysis_obj)

    # Flag top recommended resume
    if best_analysis_id:
        ResumeJobAnalysis.objects.filter(job=job).update(is_recommended=False)
        ResumeJobAnalysis.objects.filter(id=best_analysis_id).update(is_recommended=True)

    # Re-fetch updated list ordered by suitability score
    return list(ResumeJobAnalysis.objects.filter(job=job).order_by('-suitability_score'))

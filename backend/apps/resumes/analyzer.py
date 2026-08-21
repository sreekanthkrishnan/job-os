import os
import re
import json
import logging
from typing import Dict, Any, List
from django.conf import settings
from apps.skills.normalizer import normalize_skill_list, BUILTIN_SKILL_ALIASES, infer_skill_category

logger = logging.getLogger(__name__)

def fallback_rule_based_resume_analysis(raw_text: str) -> Dict[str, Any]:
    """
    Fallback deterministic parser if Gemini AI is unavailable.
    """
    extracted_skills = set()
    for alias, canonical in BUILTIN_SKILL_ALIASES.items():
        pattern = r'\b' + re.escape(alias) + r'\b'
        if re.search(pattern, raw_text, re.IGNORECASE):
            extracted_skills.add(canonical)

    normalized_skills = normalize_skill_list(list(extracted_skills))

    # Basic skill category breakdown
    categories: Dict[str, List[str]] = {
        "frontend": [], "backend": [], "database": [], "devops": [],
        "cloud": [], "testing": [], "ai_ml": [], "tools": []
    }
    for sk in normalized_skills:
        cat = infer_skill_category(sk)
        if cat in categories:
            categories[cat].append(sk)
        else:
            categories["tools"].append(sk)

    # Basic name extraction heuristic (first non-empty line)
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    candidate_name = lines[0] if lines and len(lines[0]) < 50 else "Candidate Profile"

    # Seniority heuristic
    seniority = "Mid"
    if re.search(r'\bsenior|lead|principal|head|director|vp\b', raw_text, re.IGNORECASE):
        seniority = "Senior"
    elif re.search(r'\bjunior|associate|intern|entry\b', raw_text, re.IGNORECASE):
        seniority = "Junior"

    # Years experience heuristic
    exp_match = re.search(r'(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs)\b', raw_text, re.IGNORECASE)
    years_exp = float(exp_match.group(1)) if exp_match else 3.0

    return {
        "candidate_name": candidate_name,
        "current_role": "",
        "years_of_experience": years_exp,
        "seniority_level": seniority,
        "professional_summary": raw_text[:300] + "..." if len(raw_text) > 300 else raw_text,
        "companies": [],
        "experience": [],
        "skills": normalized_skills,
        "skill_categories": categories,
        "education": [],
        "certifications": [],
        "projects": [],
        "quantifiable_achievements": [],
        "keywords": normalized_skills,
        "source": "rule_based_fallback"
    }


def analyze_resume_text(raw_text: str) -> Dict[str, Any]:
    """
    Parses resume text using Google Gemini AI and returns structured JSON profile.
    """
    if not raw_text or not raw_text.strip():
        return fallback_rule_based_resume_analysis("")

    api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
    if not api_key:
        from dotenv import load_dotenv
        load_dotenv(settings.BASE_DIR / '.env', override=True)
        load_dotenv(settings.BASE_DIR.parent / '.env', override=True)
        api_key = os.getenv('GEMINI_API_KEY', '')

    if not api_key:
        logger.info("GEMINI_API_KEY not configured. Using fallback rule-based resume parser.")
        return fallback_rule_based_resume_analysis(raw_text)

    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an expert AI Resume Intelligence Parser. Parse the following raw resume text and extract a comprehensive, structured JSON profile with these exact fields:

- candidate_name (string)
- current_role (string)
- years_of_experience (number, e.g. 5.5)
- seniority_level ("Junior", "Mid", "Senior", "Lead", "Executive")
- professional_summary (string)
- companies (array of company name strings)
- experience (array of objects with: company, role, duration, responsibilities (array of strings), achievements (array of strings))
- skills (array of skill name strings)
- skill_categories (object with arrays for keys: "frontend", "backend", "database", "devops", "cloud", "testing", "ai_ml", "tools")
- education (array of objects with: degree, institution, year)
- certifications (array of strings)
- projects (array of objects with: name, description, technologies (array of strings))
- quantifiable_achievements (array of strings)
- keywords (array of domain/industry keywords)

Resume Text:
\"\"\"
{raw_text}
\"\"\"

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

        # Normalize extracted skills
        raw_skills = parsed.get("skills", [])
        normalized = normalize_skill_list(raw_skills)
        parsed["skills"] = normalized

        # Ensure skill categories are normalized too
        categories = parsed.get("skill_categories", {})
        if isinstance(categories, dict):
            for cat, sk_list in categories.items():
                if isinstance(sk_list, list):
                    categories[cat] = normalize_skill_list(sk_list)
        parsed["skill_categories"] = categories

        parsed["source"] = "gemini_ai"
        return parsed

    except Exception as e:
        logger.warning(f"Gemini AI Resume analysis failed ({str(e)}). Falling back to rule-based parser.")
        fallback_res = fallback_rule_based_resume_analysis(raw_text)
        fallback_res["ai_error"] = str(e)
        return fallback_res

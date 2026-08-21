import os
import re
import json
import logging
from typing import Dict, Any, List
from django.conf import settings
from apps.skills.normalizer import normalize_skill_list, infer_skill_category

logger = logging.getLogger(__name__)

# Fallback regex keyword database for skill extraction when AI key is absent
COMMON_SKILL_KEYWORDS = [
    "React", "ReactJS", "React.js", "Vue", "Vue.js", "Angular", "Next.js", "Nuxt.js",
    "TypeScript", "JavaScript", "HTML", "HTML5", "CSS", "CSS3", "Tailwind", "Tailwind CSS",
    "Redux", "Zustand", "Node", "Node.js", "Express", "Express.js", "NestJS", "Python",
    "Django", "Django REST Framework", "DRF", "FastAPI", "Go", "Golang", "Java", "C#",
    ".NET", "PostgreSQL", "Postgres", "MongoDB", "Mongo", "Redis", "MySQL", "SQLite",
    "Docker", "Kubernetes", "K8s", "Git", "GitHub", "AWS", "Google Cloud", "GCP", "Azure",
    "REST API", "RESTful", "GraphQL", "CI/CD", "Jest", "Vitest", "Playwright", "Cypress"
]

def fallback_rule_based_analysis(raw_text: str) -> Dict[str, Any]:
    """
    Fallback deterministic parser using regex keyword matching if AI is unavailable.
    """
    extracted_skills = set()
    for kw in COMMON_SKILL_KEYWORDS:
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, raw_text, re.IGNORECASE):
            extracted_skills.add(kw)

    normalized_skills = normalize_skill_list(list(extracted_skills))

    # Attempt basic regex extraction for Role & Company
    company_match = re.search(r'(?:at|company:?|hiring for)\s+([A-Z][A-Za-z0-9\s]+?)(?:\,|\.|\n|is)', raw_text, re.IGNORECASE)
    company = company_match.group(1).strip() if company_match else ""

    role_match = re.search(r'(?:looking for|hiring|role:?|position:?)\s+(?:a|an)?\s+([A-Z][A-Za-z0-9\s]+?)(?:\,|\.|\n|with)', raw_text, re.IGNORECASE)
    role = role_match.group(1).strip() if role_match else ""

    # Work mode detection
    work_mode = "remote"
    if re.search(r'\bhybrid\b', raw_text, re.IGNORECASE):
        work_mode = "hybrid"
    elif re.search(r'\bonsite|on-site|in-office\b', raw_text, re.IGNORECASE):
        work_mode = "onsite"

    return {
        "company": company,
        "role": role,
        "location": "",
        "work_mode": work_mode,
        "employment_type": "full_time",
        "experience_required": "",
        "salary": "",
        "required_skills": normalized_skills,
        "preferred_skills": [],
        "responsibilities": [],
        "source": "rule_based_fallback"
    }


def analyze_job_description(raw_text: str) -> Dict[str, Any]:
    """
    Analyzes raw job description text.
    Uses Google Gemini API if GEMINI_API_KEY is set, otherwise falls back to rule-based parser.
    """
    if not raw_text or not raw_text.strip():
        return fallback_rule_based_analysis("")

    api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
    if not api_key:
        from dotenv import load_dotenv
        load_dotenv(settings.BASE_DIR / '.env', override=True)
        load_dotenv(settings.BASE_DIR.parent / '.env', override=True)
        api_key = os.getenv('GEMINI_API_KEY', '')

    if not api_key:
        logger.info("GEMINI_API_KEY not configured. Using rule-based fallback analyzer.")
        return fallback_rule_based_analysis(raw_text)


    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        prompt = f"""
You are an expert AI Job Description Analyzer. Parse the following raw job description text and extract structured JSON output with these exact fields:
- company (string or empty)
- role (string or empty)
- location (string or empty)
- work_mode ("remote", "hybrid", "onsite")
- employment_type ("full_time", "part_time", "contract", "internship")
- experience_required (string or empty)
- salary (string or empty)
- required_skills (array of skill name strings)
- preferred_skills (array of skill name strings)
- responsibilities (array of short string bullet points)

Job Description Text:
\"\"\"
{raw_text}
\"\"\"

Return ONLY valid JSON without markdown formatting or code blocks.
"""

        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt
        )


        text_content = response.text.strip()
        # Clean potential markdown fences
        if text_content.startswith("```"):
            text_content = re.sub(r'^```(?:json)?\n', '', text_content)
            text_content = re.sub(r'\n```$', '', text_content)

        parsed = json.loads(text_content)

        # Normalize extracted skills
        raw_req_skills = parsed.get("required_skills", [])
        parsed["required_skills"] = normalize_skill_list(raw_req_skills)
        parsed["source"] = "gemini_ai"

        return parsed

    except Exception as e:
        logger.warning(f"Gemini AI Job analysis failed ({str(e)}). Falling back to rule-based parser.")
        fallback_res = fallback_rule_based_analysis(raw_text)
        fallback_res["ai_error"] = str(e)
        return fallback_res

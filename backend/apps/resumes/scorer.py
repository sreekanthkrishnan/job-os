import re
from typing import Dict, Any, List, Tuple
from apps.skills.normalizer import normalize_skill_list

# Configurable weights for scoring components (sum to 1.0)
DEFAULT_SCORE_WEIGHTS = {
    "skill_match": 0.35,
    "experience_match": 0.25,
    "role_match": 0.15,
    "seniority_match": 0.10,
    "keyword_coverage": 0.10,
    "domain_match": 0.05,
}

def extract_years_from_string(text: str) -> float:
    """Extract minimum required years of experience from job string like '3-5 years' or '5+ years'."""
    if not text:
        return 0.0
    match = re.search(r'(\d+(?:\.\d+)?)', text)
    return float(match.group(1)) if match else 0.0

def calculate_skill_match(resume_skills: List[str], job_skills: List[str]) -> Tuple[float, List[str], List[str]]:
    """Calculates skill match percentage, matching list, and missing list."""
    if not job_skills:
        return 100.0, resume_skills, []
    
    norm_resume = set(normalize_skill_list(resume_skills))
    norm_job = normalize_skill_list(job_skills)
    
    matching = [s for s in norm_job if s in norm_resume]
    missing = [s for s in norm_job if s not in norm_resume]
    
    score = (len(matching) / len(norm_job)) * 100.0
    return round(score, 2), matching, missing

def calculate_experience_match(candidate_years: float, required_exp_text: str) -> float:
    """Calculates experience suitability score."""
    req_years = extract_years_from_string(required_exp_text)
    if req_years <= 0:
        return 95.0  # Default strong score if no strict requirement specified
    
    if candidate_years >= req_years:
        return 100.0
    elif candidate_years <= 0:
        return 50.0
    else:
        # Proportional score if below requirement
        ratio = candidate_years / req_years
        return round(max(40.0, ratio * 100.0), 2)

def calculate_role_match(target_role: str, current_role: str, job_role: str) -> float:
    """Calculates role alignment score based on title overlap."""
    if not job_role:
        return 80.0
    
    job_words = set(re.findall(r'\w+', job_role.lower()))
    cand_roles = f"{target_role or ''} {current_role or ''}".lower()
    cand_words = set(re.findall(r'\w+', cand_roles))
    
    if not job_words:
        return 80.0
    
    overlap = job_words.intersection(cand_words)
    if len(overlap) == len(job_words):
        return 100.0
    elif len(overlap) > 0:
        ratio = len(overlap) / len(job_words)
        return round(70.0 + (ratio * 30.0), 2)
    else:
        return 60.0

def calculate_seniority_match(seniority_level: str, job_role: str) -> float:
    """Calculates seniority match score."""
    role_lower = job_role.lower() if job_role else ""
    seniority_lower = (seniority_level or "").lower()
    
    is_senior_job = any(w in role_lower for w in ["senior", "lead", "principal", "staff", "head"])
    is_junior_job = any(w in role_lower for w in ["junior", "associate", "intern", "entry"])
    
    if is_senior_job and seniority_lower in ["senior", "lead", "executive"]:
        return 100.0
    elif is_senior_job and seniority_lower in ["mid"]:
        return 75.0
    elif is_junior_job and seniority_lower in ["junior", "entry"]:
        return 100.0
    elif not is_senior_job and not is_junior_job:
        return 90.0
    return 70.0

def calculate_keyword_coverage(resume_text: str, resume_keywords: List[str], job_description: str) -> float:
    """Calculates keyword coverage between job description and resume content."""
    if not job_description:
        return 85.0
    
    job_words = set(w.lower() for w in re.findall(r'\b[A-Za-z]{3,}\b', job_description) if w.lower() not in {"the", "and", "for", "with", "this", "that", "from"})
    if not job_words:
        return 85.0
    
    resume_content = (resume_text + " " + " ".join(resume_keywords)).lower()
    found_count = sum(1 for w in job_words if w in resume_content)
    
    coverage = (found_count / len(job_words)) * 100.0
    return round(min(100.0, max(50.0, coverage * 1.3)), 2)

def calculate_domain_match(resume_categories: Dict[str, List[str]], job_description: str) -> float:
    """Calculates domain & technology depth alignment."""
    if not job_description:
        return 85.0
    
    job_lower = job_description.lower()
    has_cloud = any(w in job_lower for w in ["aws", "gcp", "azure", "cloud"])
    has_devops = any(w in job_lower for w in ["docker", "kubernetes", "ci/cd", "devops"])
    
    score = 80.0
    if has_cloud and resume_categories.get("cloud"):
        score += 10.0
    if has_devops and resume_categories.get("devops"):
        score += 10.0
    return min(100.0, score)


def score_resume_against_job(
    resume_parsed: Dict[str, Any],
    raw_resume_text: str,
    job_role: str,
    job_description: str,
    job_skills: List[str],
    job_exp_required: str = "",
    target_role: str = "",
    weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Computes a transparent, deterministic suitability score for a resume/job pair.
    """
    if weights is None:
        weights = DEFAULT_SCORE_WEIGHTS
        
    resume_skills = resume_parsed.get("skills", [])
    cand_years = float(resume_parsed.get("years_of_experience", 0.0) or 0.0)
    seniority = resume_parsed.get("seniority_level", "Mid")
    current_role = resume_parsed.get("current_role", "")
    categories = resume_parsed.get("skill_categories", {})
    keywords = resume_parsed.get("keywords", [])
    
    # Component calculations
    skill_score, matching_skills, missing_skills = calculate_skill_match(resume_skills, job_skills)
    exp_score = calculate_experience_match(cand_years, job_exp_required)
    role_score = calculate_role_match(target_role, current_role, job_role)
    seniority_score = calculate_seniority_match(seniority, job_role)
    keyword_score = calculate_keyword_coverage(raw_resume_text or "", keywords, job_description or "")
    domain_score = calculate_domain_match(categories, job_description or "")
    
    # Weighted overall suitability score
    overall_suitability = (
        skill_score * weights["skill_match"] +
        exp_score * weights["experience_match"] +
        role_score * weights["role_match"] +
        seniority_score * weights["seniority_match"] +
        keyword_score * weights["keyword_coverage"] +
        domain_score * weights["domain_match"]
    )
    overall_suitability = round(min(100.0, max(0.0, overall_suitability)), 2)
    
    # ATS Compatibility score (average of skill match, keyword coverage, and role match)
    ats_score = round((skill_score * 0.4 + keyword_score * 0.4 + role_score * 0.2), 2)
    
    return {
        "suitability_score": overall_suitability,
        "skill_match_score": skill_score,
        "experience_match_score": exp_score,
        "role_match_score": role_score,
        "seniority_match_score": seniority_score,
        "keyword_score": keyword_score,
        "domain_score": domain_score,
        "ats_score": ats_score,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
    }

from typing import Dict, List, Tuple
from apps.skills.models import Skill
from apps.skills.normalizer import normalize_skill_name, normalize_skill_list

def calculate_job_match(user, job) -> Tuple[float, List[str], List[str], List[str]]:
    """
    Deterministically compares job skills against the user's skill profile.
    Returns:
      (match_score, matching_skills, missing_skills, user_skills)
    """
    # 1. Fetch user's profile skills (canonical names)
    user_skill_names = list(Skill.objects.filter(user=user).values_list('name', flat=True))
    user_skill_set = set(normalize_skill_list(user_skill_names))

    # 2. Fetch job required & preferred skills
    job_skills = list(job.job_skills.values_list('skill_name', flat=True))
    normalized_job_skills = normalize_skill_list(job_skills)

    if not normalized_job_skills:
        return 0.0, [], [], sorted(list(user_skill_set))

    # 3. Intersect skills
    matching_skills = []
    missing_skills = []

    for js in normalized_job_skills:
        if js in user_skill_set:
            matching_skills.append(js)
        else:
            missing_skills.append(js)

    # 4. Calculate score percentage
    score = (len(matching_skills) / len(normalized_job_skills)) * 100.0
    score = round(score, 2)

    return score, matching_skills, missing_skills, sorted(list(user_skill_set))


def recalculate_and_save_job_match(user, job) -> float:
    """
    Recalculates match score for a job and persists to DB.
    """
    score, _, _, _ = calculate_job_match(user, job)
    job.match_score = score
    job.save(update_fields=['match_score', 'updated_at'])
    return score

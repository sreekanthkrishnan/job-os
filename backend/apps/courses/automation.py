import logging
from django.utils import timezone
from .models import Course, CourseStatus
from apps.skills.models import Skill, SkillCategory, SkillSource, SkillProficiency
from apps.skills.normalizer import normalize_skill_name, infer_skill_category
from apps.jobs.models import Job
from apps.jobs.matcher import recalculate_and_save_job_match

logger = logging.getLogger(__name__)

def handle_course_completion(course: Course) -> List[str]:
    """
    Idempotent Automation Engine:
    When a course is marked COMPLETED (or progress reaches 100%),
    automatically promotes associated course skills to the user's Skill profile,
    and recalculates match scores across all active jobs.
    Returns the list of newly added or updated skill names.
    """
    if course.progress < 100 and course.status != CourseStatus.COMPLETED:
        return []

    # Ensure status is marked completed
    if course.status != CourseStatus.COMPLETED:
        course.status = CourseStatus.COMPLETED
        course.save(update_fields=['status'])

    if not course.completed_at:
        course.completed_at = timezone.now()
        course.save(update_fields=['completed_at'])

    user = course.user
    added_skills = []

    # 1. Promote Course Skills to User Profile (Idempotently)
    course_skills = list(course.course_skills.values_list('skill_name', flat=True))

    for raw_skill_name in course_skills:
        norm_name = normalize_skill_name(raw_skill_name)
        if not norm_name:
            continue

        existing_skill = Skill.objects.filter(user=user, name__iexact=norm_name).first()

        if not existing_skill:
            # Create new skill entry
            category = infer_skill_category(norm_name)
            Skill.objects.create(
                user=user,
                name=norm_name,
                category=category,
                proficiency=SkillProficiency.INTERMEDIATE,
                source=SkillSource.COURSE
            )
            added_skills.append(norm_name)
            logger.info(f"Auto-added skill '{norm_name}' to profile for user {user.email} from completed course '{course.name}'")
        else:
            logger.info(f"Skill '{norm_name}' already exists in profile for user {user.email}. Skipping duplicate creation.")

    # 2. Recalculate Match Scores across all active jobs for user
    active_jobs = Job.objects.filter(user=user)
    for job in active_jobs:
        recalculate_and_save_job_match(user, job)

    return added_skills

from django.db.models import Count, Q
from apps.jobs.models import Job, JobStatus, JobSkill
from apps.interviews.models import Interview, InterviewResult
from apps.skills.models import Skill

def get_user_analytics_overview(user):
    user_jobs = Job.objects.filter(user=user)
    
    total_jobs = user_jobs.count()
    total_applied = user_jobs.exclude(status=JobStatus.WISHLIST).count()
    
    interview_statuses = [
        JobStatus.SCREENING, JobStatus.INTERVIEW,
        JobStatus.TECHNICAL, JobStatus.MANAGERIAL, JobStatus.HR
    ]
    interviews_count = user_jobs.filter(status__in=interview_statuses).count()
    
    rejected_count = user_jobs.filter(status=JobStatus.REJECTED).count()
    
    active_statuses = [
        JobStatus.APPLIED, JobStatus.SCREENING, JobStatus.INTERVIEW,
        JobStatus.TECHNICAL, JobStatus.MANAGERIAL, JobStatus.HR
    ]
    active_count = user_jobs.filter(status__in=active_statuses).count()
    
    offer_statuses = [JobStatus.OFFER, JobStatus.ACCEPTED]
    offers_count = user_jobs.filter(status__in=offer_statuses).count()
    
    # Response Rate & Conversion Rate
    responded_count = interviews_count + offers_count + rejected_count
    response_rate = round((responded_count / total_applied * 100), 1) if total_applied > 0 else 0.0
    conversion_rate = round((offers_count / total_applied * 100), 1) if total_applied > 0 else 0.0

    # Role Distribution
    roles_qs = user_jobs.values('role').annotate(count=Count('role')).order_by('-count')[:5]
    role_distribution = []
    for r in roles_qs:
        pct = round((r['count'] / total_jobs * 100), 1) if total_jobs > 0 else 0.0
        role_distribution.append({
            "name": r['role'],
            "count": r['count'],
            "percentage": pct
        })

    # Status Funnel
    status_counts = dict(user_jobs.values('status').annotate(count=Count('status')).values_list('status', 'count'))
    status_funnel = []
    for s_choice in JobStatus.choices:
        code = s_choice[0]
        label = s_choice[1]
        cnt = status_counts.get(code, 0)
        status_funnel.append({
            "status": code,
            "label": label,
            "count": cnt
        })

    # Skill Gap Heatmap — Top Missing Skills Across All Applied Jobs
    user_skill_names = set(Skill.objects.filter(user=user).values_list('name', flat=True))
    missing_skill_counts = {}
    
    all_job_skills = JobSkill.objects.filter(job__user=user, is_required=True).values_list('skill_name', flat=True)
    for sname in all_job_skills:
        if sname not in user_skill_names:
            missing_skill_counts[sname] = missing_skill_counts.get(sname, 0) + 1
            
    sorted_missing_skills = sorted(missing_skill_counts.items(), key=lambda item: item[1], reverse=True)[:10]
    top_missing_skills = [{"skill_name": k, "count": v} for k, v in sorted_missing_skills]

    # Recent Jobs (Top 5)
    recent_jobs_qs = user_jobs.order_by('-updated_at')[:5]
    recent_jobs = []
    for j in recent_jobs_qs:
        recent_jobs.append({
            "id": str(j.id),
            "company": j.company,
            "role": j.role,
            "status": j.status,
            "applied_date": str(j.applied_date),
            "match_score": float(j.match_score) if j.match_score is not None else 0.0
        })

    # Upcoming Interviews (Top 5)
    upcoming_qs = Interview.objects.filter(
        job__user=user,
        result__in=[InterviewResult.SCHEDULED, InterviewResult.RESCHEDULED]
    ).select_related('job').order_by('scheduled_at')[:5]
    
    upcoming_interviews = []
    for iv in upcoming_qs:
        upcoming_interviews.append({
            "id": str(iv.id),
            "job_id": str(iv.job.id),
            "job_company": iv.job.company,
            "job_role": iv.job.role,
            "round_type": iv.round_type,
            "scheduled_at": iv.scheduled_at.isoformat(),
            "interviewer": iv.interviewer,
            "result": iv.result
        })

    return {
        "total_jobs": total_jobs,
        "total_applied": total_applied,
        "interviews_scheduled": interviews_count,
        "rejected_count": rejected_count,
        "active_count": active_count,
        "offers_count": offers_count,
        "response_rate": response_rate,
        "conversion_rate": conversion_rate,
        "role_distribution": role_distribution,
        "status_funnel": status_funnel,
        "top_missing_skills": top_missing_skills,
        "recent_jobs": recent_jobs,
        "upcoming_interviews": upcoming_interviews
    }

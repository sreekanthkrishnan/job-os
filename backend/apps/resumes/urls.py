from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.resumes.views import (
    ResumeViewSet,
    analyze_job_resumes_view,
    get_job_resume_analyses_view,
    get_recommended_resume_view,
    optimize_resume_view,
    generate_outreach_view,
    get_job_outreach_messages_view,
    select_job_resume_view
)

router = DefaultRouter()
router.register(r'resumes', ResumeViewSet, basename='resume')

urlpatterns = [
    path('', include(router.urls)),
    path('jobs/<uuid:job_id>/analyze-resumes/', analyze_job_resumes_view, name='job-analyze-resumes'),
    path('jobs/<uuid:job_id>/resume-analysis/', get_job_resume_analyses_view, name='job-resume-analysis'),
    path('jobs/<uuid:job_id>/recommended-resume/', get_recommended_resume_view, name='job-recommended-resume'),
    path('jobs/<uuid:job_id>/resume-optimize/', optimize_resume_view, name='job-resume-optimize'),
    path('jobs/<uuid:job_id>/generate-outreach/', generate_outreach_view, name='job-generate-outreach'),
    path('jobs/<uuid:job_id>/outreach/', get_job_outreach_messages_view, name='job-outreach-list'),
    path('jobs/<uuid:job_id>/select-resume/', select_job_resume_view, name='job-select-resume'),
]

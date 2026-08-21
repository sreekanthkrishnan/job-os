import io
import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.jobs.models import Job, JobSkill, JobStatus
from apps.resumes.models import Resume, ResumeJobAnalysis, ResumeOptimization, OutreachMessage
from apps.resumes.scorer import score_resume_against_job
from apps.resumes.parser import extract_text_from_pdf, extract_text_from_docx

User = get_user_model()

@pytest.fixture
def user(db):
    return User.objects.create_user(
        email='copilot_test@jobos.io',
        password='TestPassword123!',
        first_name='Sreekanth',
        last_name='Krishnan'
    )

@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def sample_job(user, db):
    job = Job.objects.create(
        user=user,
        company='Acme AI Corp',
        role='Senior React Developer',
        location='Remote',
        applied_date='2026-08-20',
        status=JobStatus.APPLIED,
        raw_description='Looking for a Senior React Developer with TypeScript, Redux, Next.js, and Node.js experience.'
    )
    JobSkill.objects.create(job=job, skill_name='React', is_required=True)
    JobSkill.objects.create(job=job, skill_name='TypeScript', is_required=True)
    JobSkill.objects.create(job=job, skill_name='Next.js', is_required=True)
    JobSkill.objects.create(job=job, skill_name='Jest', is_required=True)
    return job

@pytest.fixture
def sample_resume(user, db):
    return Resume.objects.create(
        user=user,
        name='Senior React Developer Resume',
        target_role='Senior React Developer',
        raw_text='Experienced Senior Frontend Engineer with 6 years in React, TypeScript, Redux, and Tailwind CSS. Built high performance web apps.',
        parsed_data={
            'candidate_name': 'Sreekanth Krishnan',
            'current_role': 'Senior React Developer',
            'years_of_experience': 6.0,
            'seniority_level': 'Senior',
            'professional_summary': '6 years building scalable web applications in React and TypeScript.',
            'skills': ['React', 'TypeScript', 'Redux', 'Tailwind CSS'],
            'skill_categories': {
                'frontend': ['React', 'TypeScript', 'Redux', 'Tailwind CSS']
            },
            'keywords': ['React', 'TypeScript', 'Frontend', 'Performance']
        }
    )


@pytest.mark.django_db
def test_deterministic_scoring():
    parsed = {
        'candidate_name': 'Jane Developer',
        'current_role': 'Senior React Developer',
        'years_of_experience': 5.0,
        'seniority_level': 'Senior',
        'skills': ['React', 'TypeScript', 'Redux'],
        'skill_categories': {'frontend': ['React', 'TypeScript']},
        'keywords': ['React', 'TypeScript']
    }
    scores = score_resume_against_job(
        resume_parsed=parsed,
        raw_resume_text="React TypeScript developer",
        job_role="Senior React Developer",
        job_description="Seeking Senior React Developer with TypeScript and Next.js experience",
        job_skills=["React", "TypeScript", "Next.js"],
        job_exp_required="4 years",
        target_role="Senior React Developer"
    )
    assert scores["suitability_score"] > 60.0
    assert "React" in scores["matching_skills"]
    assert "Next.js" in scores["missing_skills"]


@pytest.mark.django_db
def test_resume_upload_api(api_client):
    file_content = b"%PDF-1.4 Mock PDF content for test resume"
    file_obj = io.BytesIO(file_content)
    file_obj.name = "my_resume.pdf"

    with patch('apps.resumes.views.parse_resume_document', return_value=("Parsed mock resume text with React and Python skills", "pdf")):
        with patch('apps.resumes.views.analyze_resume_text', return_value={
            'candidate_name': 'Sreekanth',
            'current_role': 'Full Stack Developer',
            'years_of_experience': 4.0,
            'seniority_level': 'Mid',
            'skills': ['React', 'Python'],
            'skill_categories': {'frontend': ['React'], 'backend': ['Python']}
        }):
            response = api_client.post('/api/resumes/', {
                'name': 'Full Stack Resume',
                'target_role': 'Full Stack Engineer',
                'file': file_obj
            }, format='multipart')

            assert response.status_code == 201
            assert response.data['name'] == 'Full Stack Resume'
            assert 'React' in [s['name'] for s in response.data['resume_skills']]


@pytest.mark.django_db
def test_analyze_job_resumes_api(api_client, sample_job, sample_resume):
    with patch('apps.resumes.matcher.generate_qualitative_match_analysis', return_value={
        'ai_call_probability_estimate': 78,
        'ai_confidence': 'High',
        'strengths': ['Strong React and TypeScript alignment'],
        'weaknesses': ['Missing Next.js experience'],
        'evidence': ['6 years experience in React'],
        'risks': ['Missing Next.js'],
        'why_reasoning': ['High skill coverage for required frontend stack']
    }):
        response = api_client.post(f'/api/jobs/{sample_job.id}/analyze-resumes/')
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['is_recommended'] is True
        assert response.data[0]['ai_call_probability_estimate'] == 78


@pytest.mark.django_db
def test_resume_optimization_api(api_client, sample_job, sample_resume):
    response = api_client.post(f'/api/jobs/{sample_job.id}/resume-optimize/', {'resume_id': str(sample_resume.id)})
    assert response.status_code == 200
    assert 'potential_improvement' in response.data
    assert isinstance(response.data['missing_keywords'], list)


@pytest.mark.django_db
def test_generate_outreach_api(api_client, sample_job, sample_resume):
    response = api_client.post(f'/api/jobs/{sample_job.id}/generate-outreach/', {
        'resume_id': str(sample_resume.id),
        'channel': 'email',
        'tone': 'professional',
        'recipient_name': 'Sarah Recruiter'
    })
    assert response.status_code == 200
    assert response.data['recipient_name'] == 'Sarah Recruiter'
    assert len(response.data['subject_lines']) > 0

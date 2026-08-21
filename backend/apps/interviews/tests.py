from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.jobs.models import Job, JobStatus
from apps.interviews.models import Interview, InterviewRoundType, InterviewResult

User = get_user_model()

class InterviewAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='interviewuser@jobos.io',
            password='TestPassword123!'
        )
        login_res = self.client.post(reverse('auth_login'), {
            'email': 'interviewuser@jobos.io',
            'password': 'TestPassword123!'
        }, format='json')
        self.token = login_res.data['data']['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        self.job = Job.objects.create(
            user=self.user,
            company='Airbnb',
            role='Senior Frontend Engineer',
            applied_date='2026-08-10',
            status=JobStatus.INTERVIEW
        )
        self.job_interviews_url = reverse('job_interview_list_create', kwargs={'job_id': self.job.id})
        self.upcoming_url = reverse('interview_upcoming')

    def test_schedule_interview_round(self):
        payload = {
            'round_type': 'technical',
            'scheduled_at': '2026-08-25T14:30:00Z',
            'interviewer': 'Sarah Chen',
            'result': 'scheduled',
            'notes': 'Prepare React performance & system design'
        }
        res = self.client.post(self.job_interviews_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['data']['round_type'], 'technical')
        self.assertEqual(res.data['data']['interviewer'], 'Sarah Chen')

    def test_list_job_interviews_timeline(self):
        Interview.objects.create(
            job=self.job,
            round_type=InterviewRoundType.HR_SCREENING,
            scheduled_at=timezone.now() - timezone.timedelta(days=2),
            result=InterviewResult.PASSED
        )
        Interview.objects.create(
            job=self.job,
            round_type=InterviewRoundType.TECHNICAL,
            scheduled_at=timezone.now() + timezone.timedelta(days=2),
            result=InterviewResult.SCHEDULED
        )

        res = self.client.get(self.job_interviews_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['data']), 2)

    def test_upcoming_interviews_endpoint(self):
        future_time = timezone.now() + timezone.timedelta(days=1)
        Interview.objects.create(
            job=self.job,
            round_type=InterviewRoundType.CODING,
            scheduled_at=future_time,
            result=InterviewResult.SCHEDULED
        )

        res = self.client.get(self.upcoming_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['data']), 1)
        self.assertEqual(res.data['data'][0]['job_company'], 'Airbnb')

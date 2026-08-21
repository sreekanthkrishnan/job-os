from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.jobs.models import Job, JobStatus, JobSkill
from apps.skills.models import Skill

User = get_user_model()

class AnalyticsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='analyticsuser@jobos.io',
            password='TestPassword123!'
        )
        login_res = self.client.post(reverse('auth_login'), {
            'email': 'analyticsuser@jobos.io',
            'password': 'TestPassword123!'
        }, format='json')
        self.token = login_res.data['data']['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        self.url = reverse('analytics_overview')

    def test_analytics_overview_empty_user(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data['data']
        self.assertEqual(data['total_applied'], 0)
        self.assertEqual(data['response_rate'], 0.0)
        self.assertEqual(data['conversion_rate'], 0.0)

    def test_analytics_overview_with_jobs_and_skills(self):
        # User has skill: React
        Skill.objects.create(user=self.user, name='React')

        # Job 1: Applied, requires React & Docker. Match score calculated.
        j1 = Job.objects.create(user=self.user, company='Stripe', role='Frontend Engineer', applied_date='2026-08-01', status=JobStatus.APPLIED)
        JobSkill.objects.create(job=j1, skill_name='React', is_required=True)
        JobSkill.objects.create(job=j1, skill_name='Docker', is_required=True)

        # Job 2: Interview status
        Job.objects.create(user=self.user, company='Airbnb', role='Frontend Engineer', applied_date='2026-08-05', status=JobStatus.INTERVIEW)

        # Job 3: Offer status
        Job.objects.create(user=self.user, company='Google', role='Staff Engineer', applied_date='2026-08-10', status=JobStatus.OFFER)

        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data['data']
        self.assertEqual(data['total_applied'], 3)
        self.assertEqual(data['interviews_scheduled'], 1)
        self.assertEqual(data['offers_count'], 1)
        # Responded: 1 interview + 1 offer = 2 / 3 applied = 66.7%
        self.assertEqual(data['response_rate'], 66.7)
        # Conversion: 1 offer / 3 applied = 33.3%
        self.assertEqual(data['conversion_rate'], 33.3)
        # Top missing skill should be Docker (since user has React but lacks Docker)
        self.assertEqual(data['top_missing_skills'][0]['skill_name'], 'Docker')

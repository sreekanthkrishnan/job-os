from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.jobs.models import Job, JobSkill, JobStatus
from apps.skills.models import Skill

User = get_user_model()

class JobAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='jobuser@jobos.io',
            password='TestPassword123!'
        )
        login_res = self.client.post(reverse('auth_login'), {
            'email': 'jobuser@jobos.io',
            'password': 'TestPassword123!'
        }, format='json')
        self.token = login_res.data['data']['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        # Add profile skills for user
        Skill.objects.create(user=self.user, name='React', category='frontend')
        Skill.objects.create(user=self.user, name='TypeScript', category='frontend')

        self.list_url = reverse('job_list_create')
        self.analyze_url = reverse('job_analyze')
        self.excel_export_url = reverse('job_export_excel')
        self.csv_export_url = reverse('job_export_csv')

    def test_create_job_calculates_match_score(self):
        payload = {
            'company': 'Tech Corp',
            'role': 'Senior React Developer',
            'applied_date': '2026-08-20',
            'status': 'applied',
            'skills': ['ReactJS', 'TypeScript', 'Docker', 'AWS']
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['data']['company'], 'Tech Corp')
        # 2 matching skills (React, TypeScript) out of 4 required skills = 50.00%
        self.assertEqual(float(res.data['data']['match_score']), 50.0)
        self.assertEqual(len(res.data['data']['matching_skills']), 2)
        self.assertEqual(len(res.data['data']['missing_skills']), 2)

    def test_job_pagination_and_filters(self):
        # Create 25 jobs
        for i in range(25):
            Job.objects.create(
                user=self.user,
                company=f'Company {i}',
                role='Software Engineer' if i % 2 == 0 else 'React Developer',
                applied_date='2026-08-01',
                status=JobStatus.APPLIED if i < 10 else JobStatus.INTERVIEW
            )

        # Test page 1 with page_size=10
        res = self.client.get(f"{self.list_url}?page=1&page_size=10")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['data']), 10)
        self.assertEqual(res.data['pagination']['total'], 25)

        # Test status filter
        res_filtered = self.client.get(f"{self.list_url}?status=interview")
        self.assertEqual(res_filtered.data['pagination']['total'], 15)

    def test_job_status_update(self):
        job = Job.objects.create(
            user=self.user,
            company='Stripe',
            role='Frontend Engineer',
            applied_date='2026-08-15',
            status=JobStatus.APPLIED
        )
        status_url = reverse('job_status_update', kwargs={'id': job.id})
        res = self.client.patch(status_url, {'status': 'interview'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['status'], 'interview')

    def test_analyze_job_description_endpoint(self):
        sample_jd = """
        We are hiring a Senior React Developer at Stripe in San Francisco.
        Required skills: ReactJS, TypeScript, Docker, AWS.
        Work mode: Hybrid.
        """
        res = self.client.post(self.analyze_url, {'raw_description': sample_jd}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertIn('React', res.data['data']['required_skills'])
        self.assertIn('TypeScript', res.data['data']['required_skills'])
        self.assertEqual(len(res.data['data']['matching_skills']), 2)
        self.assertEqual(len(res.data['data']['missing_skills']), 2)

    def test_job_export_excel_endpoint(self):
        Job.objects.create(
            user=self.user,
            company='Stripe',
            role='Senior Frontend Engineer',
            applied_date='2026-08-10',
            status=JobStatus.APPLIED
        )
        res = self.client.get(self.excel_export_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            res.headers['Content-Type'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        self.assertIn('attachment; filename="JobOS_Applications_Export.xlsx"', res.headers['Content-Disposition'])

    def test_job_export_csv_endpoint(self):
        Job.objects.create(
            user=self.user,
            company='Google',
            role='Staff Engineer',
            applied_date='2026-08-12',
            status=JobStatus.OFFER
        )
        res = self.client.get(self.csv_export_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.headers['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename="JobOS_Applications_Export.csv"', res.headers['Content-Disposition'])

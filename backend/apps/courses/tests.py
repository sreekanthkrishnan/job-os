from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.courses.models import Course, CourseStatus, CourseNote
from apps.skills.models import Skill
from apps.jobs.models import Job, JobStatus, JobSkill

User = get_user_model()

class CourseAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='courseuser@jobos.io',
            password='TestPassword123!'
        )
        login_res = self.client.post(reverse('auth_login'), {
            'email': 'courseuser@jobos.io',
            'password': 'TestPassword123!'
        }, format='json')
        self.token = login_res.data['data']['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        self.list_url = reverse('course_list_create')

    def test_create_course_with_skills_and_notes(self):
        payload = {
            'name': 'React Performance Mastery',
            'provider': 'Udemy',
            'progress': 40,
            'status': 'in_progress',
            'skills': ['React', 'Redux', 'Performance Optimization']
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['data']['name'], 'React Performance Mastery')
        self.assertEqual(len(res.data['data']['course_skills']), 3)

    def test_course_completion_promotes_skills_and_recalculates_job_match(self):
        # 1. User has a job requiring AWS and Docker. Initial match = 0%
        job = Job.objects.create(
            user=self.user,
            company='Cloud Corp',
            role='DevOps Architect',
            applied_date='2026-08-15',
            status=JobStatus.APPLIED
        )
        JobSkill.objects.create(job=job, skill_name='AWS')
        JobSkill.objects.create(job=job, skill_name='Docker')
        job.refresh_from_db()
        self.assertEqual(float(job.match_score), 0.0)

        # 2. User creates a course covering AWS and Docker at 50%
        create_res = self.client.post(self.list_url, {
            'name': 'AWS & Docker Fundamentals',
            'provider': 'Coursera',
            'progress': 50,
            'status': 'in_progress',
            'skills': ['AWS', 'Docker']
        }, format='json')
        course_id = create_res.data['data']['id']

        # Skills should NOT be in profile yet
        self.assertEqual(Skill.objects.filter(user=self.user).count(), 0)

        # 3. User updates course progress to 100%
        detail_url = reverse('course_detail', kwargs={'id': course_id})
        update_res = self.client.patch(detail_url, {'progress': 100}, format='json')
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(update_res.data['data']['status'], 'completed')

        # 4. Assert: AWS and Docker automatically added to User Skills
        user_skills = Skill.objects.filter(user=self.user)
        self.assertEqual(user_skills.count(), 2)
        skill_names = set(user_skills.values_list('name', flat=True))
        self.assertEqual(skill_names, {'AWS', 'Docker'})

        # 5. Assert: Idempotency (Updating course again creates ZERO duplicates)
        self.client.patch(detail_url, {'status': 'completed'}, format='json')
        self.assertEqual(Skill.objects.filter(user=self.user).count(), 2)

        # 6. Assert: Job Match Score automatically updated from 0% to 100%!
        job.refresh_from_db()
        self.assertEqual(float(job.match_score), 100.0)

from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.courses.models import (
    Course, CourseStatus, CourseNote,
    LearningRoadmap, RoadmapModule, RoadmapTopic, LearningResource,
    TopicStatus
)
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

        create_res = self.client.post(self.list_url, {
            'name': 'AWS & Docker Fundamentals',
            'provider': 'Coursera',
            'progress': 50,
            'status': 'in_progress',
            'skills': ['AWS', 'Docker']
        }, format='json')
        course_id = create_res.data['data']['id']

        self.assertEqual(Skill.objects.filter(user=self.user).count(), 0)

        detail_url = reverse('course_detail', kwargs={'id': course_id})
        update_res = self.client.patch(detail_url, {'progress': 100}, format='json')
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(update_res.data['data']['status'], 'completed')

        user_skills = Skill.objects.filter(user=self.user)
        self.assertEqual(user_skills.count(), 2)
        skill_names = set(user_skills.values_list('name', flat=True))
        self.assertEqual(skill_names, {'AWS', 'Docker'})

        self.client.patch(detail_url, {'status': 'completed'}, format='json')
        self.assertEqual(Skill.objects.filter(user=self.user).count(), 2)

        job.refresh_from_db()
        self.assertEqual(float(job.match_score), 100.0)


@patch('apps.courses.services.get_gemini_client', return_value=None)
class LearningRoadmapAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='roadmapuser@jobos.io',
            password='TestPassword123!'
        )
        login_res = self.client.post(reverse('auth_login'), {
            'email': 'roadmapuser@jobos.io',
            'password': 'TestPassword123!'
        }, format='json')
        self.token = login_res.data['data']['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

    def test_generate_learning_roadmap_api(self, mock_gemini):
        generate_url = reverse('roadmap_generate')
        payload = {
            'goal': 'Django for Backend Development',
            'reason': 'Career Switch',
            'current_level': 'intermediate',
            'target_level': 'advanced',
            'weekly_hours': 7
        }
        res = self.client.post(generate_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])
        self.assertIn('Django', res.data['data']['title'])
        self.assertGreater(len(res.data['data']['modules']), 0)
        self.assertGreater(len(res.data['data']['topics']), 0)

    def test_topic_progress_update_recalculates_roadmap_and_creates_skill(self, mock_gemini):
        roadmap = LearningRoadmap.objects.create(
            user=self.user,
            title='Python Fullstack Roadmap',
            goal='Fullstack Mastery'
        )
        module = RoadmapModule.objects.create(roadmap=roadmap, title='Phase 1: Backend')
        topic = RoadmapTopic.objects.create(
            roadmap=roadmap,
            module=module,
            title='Django REST Framework',
            target_skills=['Django', 'Django REST Framework'],
            progress=0
        )

        progress_url = reverse('roadmap_topic_progress', kwargs={'topic_id': str(topic.id)})
        res = self.client.patch(progress_url, {'progress': 100, 'status': 'completed'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['status'], 'completed')

        roadmap.refresh_from_db()
        self.assertEqual(roadmap.overall_progress, 100)

        # Skill learning evidence should be created
        self.assertTrue(Skill.objects.filter(user=self.user, name='Django REST Framework').exists())

    def test_job_learning_roadmap_api(self, mock_gemini):
        job = Job.objects.create(
            user=self.user,
            company='Stripe',
            role='Backend Engineer',
            applied_date='2026-08-18',
            status=JobStatus.APPLIED
        )
        job_roadmap_url = reverse('job_learning_roadmap', kwargs={'id': str(job.id)})
        res = self.client.post(job_roadmap_url, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])
        self.assertEqual(str(res.data['data']['source_job']), str(job.id))

    def test_dashboard_stats_api(self, mock_gemini):
        stats_url = reverse('roadmap_dashboard_stats')
        res = self.client.get(stats_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertIn('total_courses', res.data['data'])
        self.assertIn('ai_insights', res.data['data'])

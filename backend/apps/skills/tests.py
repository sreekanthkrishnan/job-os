from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.skills.models import Skill, SkillCategory, SkillProficiency, SkillSource
from apps.skills.normalizer import normalize_skill_name, normalize_skill_list, infer_skill_category

User = get_user_model()

class SkillNormalizerTests(TestCase):
    def test_alias_normalization(self):
        self.assertEqual(normalize_skill_name("ReactJS"), "React")
        self.assertEqual(normalize_skill_name("react.js"), "React")
        self.assertEqual(normalize_skill_name("Postgres"), "PostgreSQL")
        self.assertEqual(normalize_skill_name("ts"), "TypeScript")
        self.assertEqual(normalize_skill_name("node"), "Node.js")
        self.assertEqual(normalize_skill_name("k8s"), "Kubernetes")
        self.assertEqual(normalize_skill_name("gcp"), "Google Cloud Platform")

    def test_list_normalization_deduplication(self):
        raw_list = ["ReactJS", "react", "React.js", "TypeScript", "ts", "Docker"]
        normalized = normalize_skill_list(raw_list)
        self.assertEqual(normalized, ["Docker", "React", "TypeScript"])

    def test_category_inference(self):
        self.assertEqual(infer_skill_category("React"), "frontend")
        self.assertEqual(infer_skill_category("Python"), "backend")
        self.assertEqual(infer_skill_category("PostgreSQL"), "database")
        self.assertEqual(infer_skill_category("Docker"), "devops")


class SkillAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='skilluser@jobos.io',
            password='TestPassword123!'
        )
        signup_res = self.client.post(reverse('auth_login'), {
            'email': 'skilluser@jobos.io',
            'password': 'TestPassword123!'
        }, format='json')
        self.token = signup_res.data['data']['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        self.list_url = reverse('skill_list_create')
        self.stats_url = reverse('skill_stats')
        self.normalize_url = reverse('skill_normalize')

    def test_create_skill_auto_normalizes(self):
        payload = {
            'name': 'ReactJS',
            'proficiency': 'expert',
            'category': 'frontend'
        }
        res = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['data']['name'], 'React')
        self.assertEqual(res.data['data']['category'], 'frontend')
        self.assertEqual(res.data['data']['proficiency'], 'expert')

    def test_create_duplicate_skill_updates(self):
        self.client.post(self.list_url, {'name': 'React', 'proficiency': 'beginner'}, format='json')
        res = self.client.post(self.list_url, {'name': 'ReactJS', 'proficiency': 'advanced'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Skill.objects.filter(user=self.user, name='React').count(), 1)
        self.assertEqual(Skill.objects.get(user=self.user, name='React').proficiency, 'advanced')

    def test_list_skills_with_filters(self):
        self.client.post(self.list_url, {'name': 'React', 'category': 'frontend'}, format='json')
        self.client.post(self.list_url, {'name': 'Python', 'category': 'backend'}, format='json')

        res = self.client.get(f"{self.list_url}?category=frontend")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['data']), 1)
        self.assertEqual(res.data['data'][0]['name'], 'React')

    def test_normalize_preview_endpoint(self):
        res = self.client.post(self.normalize_url, {'skill': 'postgres'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['canonical'], 'PostgreSQL')
        self.assertEqual(res.data['data']['inferred_category'], 'database')

    def test_skill_stats_endpoint(self):
        self.client.post(self.list_url, {'name': 'React', 'category': 'frontend'}, format='json')
        self.client.post(self.list_url, {'name': 'TypeScript', 'category': 'frontend'}, format='json')
        self.client.post(self.list_url, {'name': 'Python', 'category': 'backend'}, format='json')

        res = self.client.get(self.stats_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['total'], 3)

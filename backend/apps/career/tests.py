from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.career.models import CareerProfile, TargetRole

User = get_user_model()

class CareerAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='careeruser@jobos.io',
            password='TestPassword123!'
        )
        login_res = self.client.post(reverse('auth_login'), {
            'email': 'careeruser@jobos.io',
            'password': 'TestPassword123!'
        }, format='json')
        self.token = login_res.data['data']['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        self.profile_url = reverse('career_profile')
        self.target_roles_url = reverse('target_role_list_create')

    def test_get_and_patch_career_profile(self):
        # GET auto-creates blank profile
        get_res = self.client.get(self.profile_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data['data']['user_email'], 'careeruser@jobos.io')

        # PATCH updates profile metadata
        patch_payload = {
            'current_role': 'Senior Software Engineer',
            'years_of_experience': 5.5,
            'expected_ctc_min': '18 LPA',
            'expected_ctc_max': '22 LPA',
            'notice_period': '30 Days',
            'preferred_locations': ['Remote', 'Bangalore', 'Kerala'],
            'preferred_work_modes': ['remote', 'hybrid'],
            'career_goal': 'Transition to Staff Engineer & Cloud Architect'
        }
        patch_res = self.client.patch(self.profile_url, patch_payload, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['data']['current_role'], 'Senior Software Engineer')
        self.assertEqual(float(patch_res.data['data']['years_of_experience']), 5.5)
        self.assertEqual(len(patch_res.data['data']['preferred_locations']), 3)

    def test_target_roles_crud_and_primary_flag_management(self):
        # Add primary role
        res1 = self.client.post(self.target_roles_url, {
            'name': 'Senior React Developer',
            'priority': 1,
            'is_primary': True
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res1.data['data']['is_primary'])

        # Add secondary role
        res2 = self.client.post(self.target_roles_url, {
            'name': 'Frontend Architect',
            'priority': 2,
            'is_primary': False
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res2.data['data']['is_primary'])

        # Promoting secondary role to primary should auto-demote the first one
        role2_id = res2.data['data']['id']
        detail_url = reverse('target_role_detail', kwargs={'id': role2_id})
        update_res = self.client.patch(detail_url, {'is_primary': True}, format='json')
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)

        # Check that role 1 is no longer primary
        role1_id = res1.data['data']['id']
        role1_detail = self.client.get(reverse('target_role_detail', kwargs={'id': role1_id}))
        self.assertFalse(role1_detail.data['data']['is_primary'])

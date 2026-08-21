from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.signup_url = reverse('auth_signup')
        self.login_url = reverse('auth_login')
        self.me_url = reverse('auth_me')

        self.user_data = {
            'email': 'dev@jobos.io',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'Dev',
            'last_name': 'Tester'
        }

    def test_signup_successful(self):
        response = self.client.post(self.signup_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('tokens', response.data['data'])
        self.assertEqual(response.data['data']['user']['email'], 'dev@jobos.io')

    def test_signup_duplicate_email(self):
        self.client.post(self.signup_url, self.user_data, format='json')
        response = self.client.post(self.signup_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_login_successful(self):
        self.client.post(self.signup_url, self.user_data, format='json')
        login_payload = {
            'email': 'dev@jobos.io',
            'password': 'SecurePassword123!'
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data']['tokens'])

    def test_user_me_authenticated(self):
        signup_res = self.client.post(self.signup_url, self.user_data, format='json')
        token = signup_res.data['data']['tokens']['access']

        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        me_res = self.client.get(self.me_url)
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data['data']['email'], 'dev@jobos.io')

# tests.py
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from .models import PasswordResetCode, PasswordResetToken, Dietitian
import uuid

User = get_user_model()

class UserRegistrationTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register_user')
        self.valid_payload = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'usertype': 'user'
        }
        self.dietitian_payload = {
            'username': 'testdietitian',
            'email': 'dietitian@example.com',
            'password': 'testpass123',
            'usertype': 'dietitian',
            'dietitian': {
                'certification_url': 'http://example.com/cert.pdf'
            }
        }

    def test_valid_user_registration(self):
        response = self.client.post(
            self.register_url,
            data=self.valid_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='test@example.com').exists())
        user = User.objects.get(email='test@example.com')
        self.assertFalse(user.is_active)  # Should be inactive until email verification

    def test_dietitian_registration(self):
        response = self.client.post(
            self.register_url,
            data=self.dietitian_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='dietitian@example.com').exists())
        user = User.objects.get(email='dietitian@example.com')
        self.assertTrue(hasattr(user, 'dietitian'))
        self.assertEqual(user.dietitian.certification_url, 'http://example.com/cert.pdf')

    def test_invalid_registration_missing_password(self):
        invalid_payload = self.valid_payload.copy()
        invalid_payload.pop('password')
        response = self.client.post(
            self.register_url,
            data=invalid_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_invalid_registration_missing_dietitian_info(self):
        invalid_payload = self.dietitian_payload.copy()
        invalid_payload.pop('dietitian')
        response = self.client.post(
            self.register_url,
            data=invalid_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('dietitian', response.data)

class EmailVerificationTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            is_active=False
        )
        self.uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        self.token = default_token_generator.make_token(self.user)
        self.verify_url = reverse('email-verify', kwargs={
            'uidb64': self.uid,
            'token': self.token
        })

    def test_valid_email_verification(self):
        response = self.client.get(self.verify_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)

    def test_invalid_uid_verification(self):
        invalid_url = reverse('email-verify', kwargs={
            'uidb64': 'invalid',
            'token': self.token
        })
        response = self.client.get(invalid_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_invalid_token_verification(self):
        invalid_url = reverse('email-verify', kwargs={
            'uidb64': self.uid,
            'token': 'invalid-token'
        })
        response = self.client.get(invalid_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

class LoginLogoutTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            is_active=True
        )
        self.login_url = reverse('login_view')
        self.logout_url = reverse('logout_view')

    def test_valid_login(self):
        response = self.client.post(
            self.login_url,
            data={'email': 'test@example.com', 'password': 'testpass123'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_invalid_login_wrong_password(self):
        response = self.client.post(
            self.login_url,
            data={'email': 'test@example.com', 'password': 'wrongpass'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_inactive_user_login(self):
        self.user.is_active = False
        self.user.save()
        response = self.client.post(
            self.login_url,
            data={'email': 'test@example.com', 'password': 'testpass123'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_logout(self):
        # First login to get token
        login_response = self.client.post(
            self.login_url,
            data={'email': 'test@example.com', 'password': 'testpass123'},
            format='json'
        )
        token = login_response.data['token']
        
        # Then logout with the token
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'Successfully logged out.')

class PasswordResetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpassword',
            is_active=True
        )
        self.request_code_url = reverse('request-password-reset-code')
        self.verify_code_url = reverse('verify-reset-code')
        self.reset_password_url = reverse('reset-password')

    def test_request_reset_code(self):
        response = self.client.post(
            self.request_code_url,
            data={'email': 'test@example.com'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(PasswordResetCode.objects.filter(email='test@example.com').exists())

    def test_verify_reset_code(self):
        # First request a code
        self.client.post(
            self.request_code_url,
            data={'email': 'test@example.com'},
            format='json'
        )
        code = PasswordResetCode.objects.get(email='test@example.com').code
        
        # Then verify it
        response = self.client.post(
            self.verify_code_url,
            data={'email': 'test@example.com', 'code': code},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertTrue(PasswordResetToken.objects.filter(email='test@example.com').exists())

    def test_reset_password_with_token(self):
        # Go through the full flow
        # 1. Request code
        self.client.post(
            self.request_code_url,
            data={'email': 'test@example.com'},
            format='json'
        )
        code = PasswordResetCode.objects.get(email='test@example.com').code
        
        # 2. Verify code to get token
        verify_response = self.client.post(
            self.verify_code_url,
            data={'email': 'test@example.com', 'code': code},
            format='json'
        )
        token = verify_response.data['token']
        
        # 3. Reset password with token
        response = self.client.post(
            self.reset_password_url,
            data={'token': token, 'new_password': 'newpassword123'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))

    def test_invalid_reset_code(self):
        response = self.client.post(
            self.verify_code_url,
            data={'email': 'test@example.com', 'code': '000000'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_expired_reset_token(self):
        # Create an expired token directly
        expired_token = PasswordResetToken.objects.create(
            email='test@example.com',
            token=uuid.uuid4()
        )
        expired_token.created_at = expired_token.created_at - PasswordResetToken().is_expired().delta
        expired_token.save()
        
        response = self.client.post(
            self.reset_password_url,
            data={'token': str(expired_token.token), 'new_password': 'newpassword123'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)


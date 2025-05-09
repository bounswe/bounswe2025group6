from django.test import TestCase
from django.core.exceptions import ValidationError
from django.urls import reverse
from api.models import RegisteredUser, RecipeRating
from recipes.models import Recipe
from datetime import datetime
from rest_framework import status
from rest_framework.test import APITestCase

class RegisteredUserModelTest(TestCase):
    def setUp(self):
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'usertype': 'user',
            'profilePhoto': 'https://example.com/photo.jpg',
            'foodAllergies': ['peanuts', 'gluten'],
            'notificationPreferences': {'email': True, 'sms': False},
            'profileVisibility': 'public',
            'recipeCount': 5,
            'avgRecipeRating': 4.2,
            'typeOfCook': 'intermediate'
        }

    def test_create_user_with_minimal_fields(self):
        """Test user creation with only required fields"""
        user = RegisteredUser.objects.create_user(
            username='minimaluser',
            email='minimal@example.com',
            password='testpass123'
        )
        self.assertEqual(user.username, 'minimaluser')
        self.assertEqual(user.usertype, 'user')  # Testing default
        self.assertTrue(user.check_password('testpass123'))

    def test_create_superuser(self):
        """Test superuser creation"""
        admin = RegisteredUser.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass'
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_user_type_choices(self):
        """Test usertype field validation"""
        user = RegisteredUser(**self.user_data)
        user.full_clean()  # Should work with valid choice

        with self.assertRaises(ValidationError):
            user.usertype = 'invalid_type'
            user.full_clean()

    def test_email_uniqueness(self):
        """Test email uniqueness constraint"""
        RegisteredUser.objects.create_user(**self.user_data)
        with self.assertRaises(Exception):  # IntegrityError or ValidationError
            RegisteredUser.objects.create_user(
                username='anotheruser',
                email='test@example.com',  # Same email
                password='testpass123'
            )

    def test_profile_visibility_choices(self):
        """Test profileVisibility field validation"""
        user = RegisteredUser(**self.user_data)
        valid_choices = ['public', 'private', 'followers_only']
        
        for choice in valid_choices:
            user.profileVisibility = choice
            user.full_clean()  # Should not raise

        with self.assertRaises(ValidationError):
            user.profileVisibility = 'invalid_visibility'
            user.full_clean()

    def test_cook_type_choices(self):
        """Test typeOfCook field validation"""
        user = RegisteredUser(**self.user_data)
        valid_choices = ['beginner', 'intermediate', 'expert', 'professional']
        
        for choice in valid_choices:
            user.typeOfCook = choice
            user.full_clean()  # Should not raise

        with self.assertRaises(ValidationError):
            user.typeOfCook = 'invalid_level'
            user.full_clean()

    def test_rating_validation(self):
        """Test avgRecipeRating validation"""
        user = RegisteredUser(**self.user_data)
        
        # Test valid ratings
        for rating in [0.0, 2.5, 5.0]:
            user.avgRecipeRating = rating
            user.full_clean()

        # Test invalid ratings
        with self.assertRaises(ValidationError):
            user.avgRecipeRating = -0.1
            user.full_clean()

        with self.assertRaises(ValidationError):
            user.avgRecipeRating = 5.1
            user.full_clean()

    def test_json_fields(self):
        """Test JSON field handling"""
        user = RegisteredUser.objects.create(**self.user_data)
        
        # Test foodAllergies
        self.assertEqual(user.foodAllergies, ['peanuts', 'gluten'])
        user.foodAllergies.append('dairy')
        user.save()
        user.refresh_from_db()
        self.assertIn('dairy', user.foodAllergies)

        # Test notificationPreferences
        self.assertEqual(user.notificationPreferences, {'email': True, 'sms': False})
        user.notificationPreferences['push'] = True
        user.save()
        user.refresh_from_db()
        self.assertTrue(user.notificationPreferences['push'])

    def test_follow_relationships(self):
        """Test user following functionality"""
        user1 = RegisteredUser.objects.create_user(username='user1', email='user1@test.com')
        user2 = RegisteredUser.objects.create_user(username='user2', email='user2@test.com')
        
        user1.followedUsers.add(user2)
        
        self.assertEqual(user1.followedUsers.count(), 1)
        self.assertEqual(user2.followers.count(), 1)
        self.assertEqual(user1.followedUsers.first(), user2)
        self.assertEqual(user2.followers.first(), user1)

    def test_timestamp_inheritance(self):
        """Test TimestampedModel functionality"""
        user = RegisteredUser.objects.create(**self.user_data)
        self.assertIsInstance(user.created_at, datetime)
        self.assertIsInstance(user.updated_at, datetime)
        
        # Test auto_now_add
        original_created = user.created_at
        user.save()
        self.assertEqual(user.created_at, original_created)
        
        # Test auto_now
        original_updated = user.updated_at
        user.save()
        self.assertNotEqual(user.updated_at, original_updated)

    def test_str_representation(self):
        """Test string representation"""
        user = RegisteredUser.objects.create(**self.user_data)
        self.assertEqual(str(user), user.username)

class UserIdLookupTests(TestCase):
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )

    def test_valid_email_lookup(self):
        url = reverse('get-user-id') + '?email=test@example.com'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], self.user.id)

    def test_missing_email(self):
        url = reverse('get-user-id')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)

    def test_invalid_email(self):
        url = reverse('get-user-id') + '?email=wrong@example.com'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

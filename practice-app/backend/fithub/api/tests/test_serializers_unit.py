"""
Comprehensive Unit Tests for API Serializers
Tests serializers in isolation with edge cases
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from api.serializers import (
    UserRegistrationSerializer, LoginSerializer,
    RequestPasswordResetCodeSerializer, VerifyPasswordResetCodeSerializer,
    ResetPasswordSerializer, HealthRatingSerializer, RegisteredUserSerializer
)
from api.models import (
    RegisteredUser, PasswordResetCode, PasswordResetToken,
    Dietitian, HealthRating
)
from recipes.models import Recipe
from django.utils import timezone
from datetime import timedelta
from unittest.mock import Mock

User = get_user_model()


class UserRegistrationSerializerTests(TestCase):
    """Unit tests for UserRegistrationSerializer"""
    
    def test_serializer_validates_regular_user(self):
        """Test serializer validates regular user registration"""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123',
            'usertype': 'user'
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_serializer_validates_dietitian_with_certification(self):
        """Test serializer validates dietitian registration with certification"""
        data = {
            'username': 'dietitian',
            'email': 'dietitian@example.com',
            'password': 'password123',
            'usertype': 'dietitian',
            'dietitian': {
                'certification_url': 'https://example.com/cert.pdf'
            }
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_serializer_rejects_dietitian_without_certification(self):
        """Test serializer rejects dietitian without certification"""
        data = {
            'username': 'dietitian',
            'email': 'dietitian@example.com',
            'password': 'password123',
            'usertype': 'dietitian'
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('dietitian', serializer.errors)
    
    def test_serializer_creates_regular_user(self):
        """Test serializer creates a regular user"""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123',
            'usertype': 'user'
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.usertype, 'user')
        self.assertTrue(user.check_password('password123'))
        self.assertFalse(hasattr(user, 'dietitian'))
    
    def test_serializer_creates_dietitian_user(self):
        """Test serializer creates a dietitian user with Dietitian object"""
        data = {
            'username': 'dietitian',
            'email': 'dietitian@example.com',
            'password': 'password123',
            'usertype': 'dietitian',
            'dietitian': {
                'certification_url': 'https://example.com/cert.pdf'
            }
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.usertype, 'dietitian')
        self.assertTrue(hasattr(user, 'dietitian'))
        self.assertEqual(user.dietitian.certification_url, 'https://example.com/cert.pdf')
    
    def test_serializer_regular_user_does_not_require_dietitian(self):
        """Test that regular user does not require dietitian data"""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123',
            'usertype': 'user',
            'dietitian': {
                'certification_url': 'https://example.com/cert.pdf'
            }
        }
        serializer = UserRegistrationSerializer(data=data)
        # Should be valid even with dietitian data for regular user
        self.assertTrue(serializer.is_valid())


class LoginSerializerTests(TestCase):
    """Unit tests for LoginSerializer"""
    
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        self.user.is_active = True
        self.user.save()
    
    def test_serializer_validates_correct_credentials(self):
        """Test serializer validates correct credentials"""
        data = {
            'email': 'test@example.com',
            'password': 'password123'
        }
        serializer = LoginSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['user'], self.user)
    
    def test_serializer_rejects_wrong_password(self):
        """Test serializer rejects wrong password"""
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_serializer_rejects_nonexistent_email(self):
        """Test serializer rejects nonexistent email"""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'password123'
        }
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_serializer_rejects_inactive_user(self):
        """Test serializer rejects inactive user"""
        self.user.is_active = False
        self.user.save()
        
        data = {
            'email': 'test@example.com',
            'password': 'password123'
        }
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_serializer_rejects_soft_deleted_user(self):
        """Test serializer rejects soft deleted user"""
        from django.utils import timezone
        self.user.deleted_on = timezone.now()
        self.user.save()
        
        data = {
            'email': 'test@example.com',
            'password': 'password123'
        }
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_serializer_creates_login_attempt_on_failure(self):
        """Test that failed login creates a LoginAttempt record"""
        from api.models import LoginAttempt
        
        initial_count = LoginAttempt.objects.count()
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        serializer = LoginSerializer(data=data)
        serializer.is_valid()  # This will fail but create LoginAttempt
        
        # Check that LoginAttempt was created
        self.assertEqual(LoginAttempt.objects.count(), initial_count + 1)
        attempt = LoginAttempt.objects.latest('timestamp')
        self.assertEqual(attempt.user, self.user)
        self.assertFalse(attempt.successful)


class RequestPasswordResetCodeSerializerTests(TestCase):
    """Unit tests for RequestPasswordResetCodeSerializer"""
    
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
    
    def test_serializer_validates_existing_email(self):
        """Test serializer validates existing email"""
        data = {'email': 'test@example.com'}
        serializer = RequestPasswordResetCodeSerializer(data=data)
        self.assertTrue(serializer.is_valid())
    
    def test_serializer_rejects_nonexistent_email(self):
        """Test serializer rejects nonexistent email"""
        data = {'email': 'nonexistent@example.com'}
        serializer = RequestPasswordResetCodeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
    
    def test_serializer_rejects_invalid_email_format(self):
        """Test serializer rejects invalid email format"""
        data = {'email': 'notanemail'}
        serializer = RequestPasswordResetCodeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
    
    def test_serializer_creates_password_reset_code(self):
        """Test serializer creates a PasswordResetCode"""
        from unittest.mock import patch
        
        data = {'email': 'test@example.com'}
        serializer = RequestPasswordResetCodeSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        with patch('api.serializers.send_mail'):
            serializer.save()
        
        code = PasswordResetCode.objects.filter(email='test@example.com').latest('created_at')
        self.assertIsNotNone(code)
        self.assertEqual(len(code.code), 6)
        self.assertFalse(code.is_used)


class VerifyPasswordResetCodeSerializerTests(TestCase):
    """Unit tests for VerifyPasswordResetCodeSerializer"""
    
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
        self.code = PasswordResetCode.objects.create(
            email='test@example.com',
            code='123456'
        )
    
    def test_serializer_validates_correct_code(self):
        """Test serializer validates correct code"""
        data = {
            'email': 'test@example.com',
            'code': '123456'
        }
        serializer = VerifyPasswordResetCodeSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['user'], self.user)
        self.assertEqual(serializer.validated_data['record'], self.code)
    
    def test_serializer_rejects_wrong_code(self):
        """Test serializer rejects wrong code"""
        data = {
            'email': 'test@example.com',
            'code': '999999'
        }
        serializer = VerifyPasswordResetCodeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_serializer_rejects_used_code(self):
        """Test serializer rejects already used code"""
        self.code.is_used = True
        self.code.save()
        
        data = {
            'email': 'test@example.com',
            'code': '123456'
        }
        serializer = VerifyPasswordResetCodeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_serializer_rejects_expired_code(self):
        """Test serializer rejects expired code"""
        self.code.created_at = timezone.now() - timedelta(minutes=11)
        self.code.save()
        
        data = {
            'email': 'test@example.com',
            'code': '123456'
        }
        serializer = VerifyPasswordResetCodeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_serializer_uses_latest_code(self):
        """Test serializer uses the latest code when multiple exist"""
        # Create another code
        new_code = PasswordResetCode.objects.create(
            email='test@example.com',
            code='654321'
        )
        
        data = {
            'email': 'test@example.com',
            'code': '654321'
        }
        serializer = VerifyPasswordResetCodeSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['record'], new_code)


class ResetPasswordSerializerTests(TestCase):
    """Unit tests for ResetPasswordSerializer"""
    
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpassword123'
        )
        self.token = PasswordResetToken.objects.create(email='test@example.com')
    
    def test_serializer_validates_valid_token(self):
        """Test serializer validates valid token"""
        data = {
            'token': str(self.token.token),
            'new_password': 'newpassword123'
        }
        serializer = ResetPasswordSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['user'], self.user)
    
    def test_serializer_rejects_invalid_token(self):
        """Test serializer rejects invalid token"""
        import uuid
        data = {
            'token': str(uuid.uuid4()),
            'new_password': 'newpassword123'
        }
        serializer = ResetPasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_serializer_rejects_expired_token(self):
        """Test serializer rejects expired token"""
        self.token.created_at = timezone.now() - timedelta(minutes=16)
        self.token.save()
        
        data = {
            'token': str(self.token.token),
            'new_password': 'newpassword123'
        }
        serializer = ResetPasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_serializer_rejects_same_password(self):
        """Test serializer rejects new password same as old password"""
        data = {
            'token': str(self.token.token),
            'new_password': 'oldpassword123'
        }
        serializer = ResetPasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new_password', serializer.errors)
    
    def test_serializer_rejects_short_password(self):
        """Test serializer rejects password shorter than 8 characters"""
        data = {
            'token': str(self.token.token),
            'new_password': 'short'
        }
        serializer = ResetPasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new_password', serializer.errors)
    
    def test_serializer_saves_new_password(self):
        """Test serializer saves new password"""
        data = {
            'token': str(self.token.token),
            'new_password': 'newpassword123'
        }
        serializer = ResetPasswordSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))
    
    def test_serializer_deletes_token_after_reset(self):
        """Test serializer deletes token after password reset"""
        data = {
            'token': str(self.token.token),
            'new_password': 'newpassword123'
        }
        serializer = ResetPasswordSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        # Token should be deleted
        self.assertFalse(PasswordResetToken.objects.filter(token=self.token.token).exists())


class HealthRatingSerializerTests(TestCase):
    """Unit tests for HealthRatingSerializer"""
    
    def setUp(self):
        self.dietitian = RegisteredUser.objects.create_user(
            username='dietitian',
            email='dietitian@example.com',
            password='password123',
            usertype=RegisteredUser.DIETITIAN
        )
        self.regular_user = RegisteredUser.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='password123',
            usertype=RegisteredUser.USER
        )
        self.recipe = Recipe.objects.create(
            name='Test Recipe',
            steps=['Step 1'],
            prep_time=10,
            cook_time=20,
            meal_type='dinner',
            creator=self.regular_user
        )
    
    def test_serializer_validates_dietitian(self):
        """Test serializer validates dietitian user"""
        request = Mock()
        request.user = self.dietitian
        
        data = {
            'recipe': self.recipe.id,
            'health_score': 4.5,
            'comment': 'Very healthy'
        }
        serializer = HealthRatingSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
    
    def test_serializer_rejects_regular_user(self):
        """Test serializer rejects regular user"""
        request = Mock()
        request.user = self.regular_user
        
        data = {
            'recipe': self.recipe.id,
            'health_score': 4.5
        }
        serializer = HealthRatingSerializer(data=data, context={'request': request})
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
    
    def test_serializer_rejects_unauthenticated_user(self):
        """Test serializer rejects unauthenticated user"""
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = False
        
        data = {
            'recipe': self.recipe.id,
            'health_score': 4.5
        }
        serializer = HealthRatingSerializer(data=data, context={'request': request})
        self.assertFalse(serializer.is_valid())
    
    def test_serializer_creates_health_rating(self):
        """Test serializer creates health rating"""
        request = Mock()
        request.user = self.dietitian
        
        data = {
            'recipe': self.recipe.id,
            'health_score': 4.5,
            'comment': 'Very healthy'
        }
        serializer = HealthRatingSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        rating = serializer.save()
        
        self.assertEqual(rating.dietitian, self.dietitian)
        self.assertEqual(rating.recipe, self.recipe)
        self.assertEqual(rating.health_score, 4.5)
        self.assertEqual(rating.comment, 'Very healthy')
    
    def test_serializer_updates_existing_rating(self):
        """Test serializer updates existing rating"""
        # Create existing rating
        existing = HealthRating.objects.create(
            dietitian=self.dietitian,
            recipe=self.recipe,
            health_score=3.0
        )
        
        request = Mock()
        request.user = self.dietitian
        
        data = {
            'recipe': self.recipe.id,
            'health_score': 5.0,
            'comment': 'Updated comment'
        }
        serializer = HealthRatingSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        rating = serializer.save()
        
        # Should return the same instance
        self.assertEqual(rating.id, existing.id)
        self.assertEqual(rating.health_score, 5.0)
        self.assertEqual(rating.comment, 'Updated comment')


class RegisteredUserSerializerTests(TestCase):
    """Unit tests for RegisteredUserSerializer"""
    
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123'
        )
    
    def test_serializer_validates_avg_recipe_rating_range(self):
        """Test serializer validates avgRecipeRating is between 0 and 5"""
        data = {
            'avgRecipeRating': 4.5
        }
        serializer = RegisteredUserSerializer(instance=self.user, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
    
    def test_serializer_rejects_avg_recipe_rating_below_zero(self):
        """Test serializer rejects avgRecipeRating below 0"""
        data = {
            'avgRecipeRating': -0.1
        }
        serializer = RegisteredUserSerializer(instance=self.user, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('avgRecipeRating', serializer.errors)
    
    def test_serializer_rejects_avg_recipe_rating_above_five(self):
        """Test serializer rejects avgRecipeRating above 5"""
        data = {
            'avgRecipeRating': 5.1
        }
        serializer = RegisteredUserSerializer(instance=self.user, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('avgRecipeRating', serializer.errors)
    
    def test_serializer_serializes_user_data(self):
        """Test serializer correctly serializes user data"""
        serializer = RegisteredUserSerializer(instance=self.user)
        data = serializer.data
        
        self.assertEqual(data['username'], 'testuser')
        self.assertEqual(data['email'], 'test@example.com')
        self.assertIn('id', data)
        self.assertIn('usertype', data)


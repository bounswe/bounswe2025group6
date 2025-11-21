"""
Comprehensive Unit Tests for API Models
Tests models in isolation with edge cases
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from api.models import (
    RegisteredUser, PasswordResetCode, PasswordResetToken,
    LoginAttempt, HealthRating, Dietitian, RecipeRating
)
from recipes.models import Recipe


class PasswordResetCodeModelTests(TestCase):
    """Unit tests for PasswordResetCode model"""
    
    def setUp(self):
        self.email = "test@example.com"
    
    def test_create_password_reset_code(self):
        """Test creating a password reset code"""
        code = PasswordResetCode.objects.create(
            email=self.email,
            code="123456"
        )
        self.assertEqual(code.email, self.email)
        self.assertEqual(code.code, "123456")
        self.assertFalse(code.is_used)
        self.assertIsNotNone(code.created_at)
    
    def test_code_not_expired_immediately(self):
        """Test that a newly created code is not expired"""
        code = PasswordResetCode.objects.create(
            email=self.email,
            code="123456"
        )
        self.assertFalse(code.is_expired())
    
    def test_code_expires_after_10_minutes(self):
        """Test that a code expires after 10 minutes"""
        code = PasswordResetCode.objects.create(
            email=self.email,
            code="123456"
        )
        # Manually set created_at to 11 minutes ago
        code.created_at = timezone.now() - timedelta(minutes=11)
        code.save()
        self.assertTrue(code.is_expired())
    
    def test_code_not_expired_at_9_minutes(self):
        """Test that a code is not expired at 9 minutes"""
        code = PasswordResetCode.objects.create(
            email=self.email,
            code="123456"
        )
        code.created_at = timezone.now() - timedelta(minutes=9)
        code.save()
        self.assertFalse(code.is_expired())
    
    def test_code_expires_exactly_at_10_minutes(self):
        """Test that a code expires exactly at 10 minutes"""
        code = PasswordResetCode.objects.create(
            email=self.email,
            code="123456"
        )
        code.created_at = timezone.now() - timedelta(minutes=10, seconds=1)
        code.save()
        self.assertTrue(code.is_expired())


class PasswordResetTokenModelTests(TestCase):
    """Unit tests for PasswordResetToken model"""
    
    def setUp(self):
        self.email = "test@example.com"
    
    def test_create_password_reset_token(self):
        """Test creating a password reset token"""
        token = PasswordResetToken.objects.create(email=self.email)
        self.assertEqual(token.email, self.email)
        self.assertIsNotNone(token.token)
        self.assertIsNotNone(token.created_at)
    
    def test_token_is_unique(self):
        """Test that each token is unique"""
        token1 = PasswordResetToken.objects.create(email=self.email)
        token2 = PasswordResetToken.objects.create(email=self.email)
        self.assertNotEqual(token1.token, token2.token)
    
    def test_token_not_expired_immediately(self):
        """Test that a newly created token is not expired"""
        token = PasswordResetToken.objects.create(email=self.email)
        self.assertFalse(token.is_expired())
    
    def test_token_expires_after_15_minutes(self):
        """Test that a token expires after 15 minutes"""
        token = PasswordResetToken.objects.create(email=self.email)
        token.created_at = timezone.now() - timedelta(minutes=16)
        token.save()
        self.assertTrue(token.is_expired())
    
    def test_token_not_expired_at_14_minutes(self):
        """Test that a token is not expired at 14 minutes"""
        token = PasswordResetToken.objects.create(email=self.email)
        token.created_at = timezone.now() - timedelta(minutes=14)
        token.save()
        self.assertFalse(token.is_expired())


class LoginAttemptModelTests(TestCase):
    """Unit tests for LoginAttempt model"""
    
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123"
        )
    
    def test_create_successful_login_attempt(self):
        """Test creating a successful login attempt"""
        attempt = LoginAttempt.objects.create(
            user=self.user,
            successful=True
        )
        self.assertEqual(attempt.user, self.user)
        self.assertTrue(attempt.successful)
        self.assertIsNotNone(attempt.timestamp)
    
    def test_create_failed_login_attempt(self):
        """Test creating a failed login attempt"""
        attempt = LoginAttempt.objects.create(
            user=self.user,
            successful=False
        )
        self.assertEqual(attempt.user, self.user)
        self.assertFalse(attempt.successful)
    
    def test_get_recent_attempts_within_timeframe(self):
        """Test getting recent failed attempts within timeframe"""
        # Create 3 failed attempts
        for _ in range(3):
            LoginAttempt.objects.create(
                user=self.user,
                successful=False
            )
        # Create 1 successful attempt (should not be counted)
        LoginAttempt.objects.create(
            user=self.user,
            successful=True
        )
        
        count = LoginAttempt.get_recent_attempts(self.user, minutes=15)
        self.assertEqual(count, 3)
    
    def test_get_recent_attempts_excludes_old_attempts(self):
        """Test that old attempts are excluded from recent attempts"""
        # Create old failed attempt (16 minutes ago)
        old_attempt = LoginAttempt.objects.create(
            user=self.user,
            successful=False
        )
        old_attempt.timestamp = timezone.now() - timedelta(minutes=16)
        old_attempt.save()
        
        # Create recent failed attempt
        LoginAttempt.objects.create(
            user=self.user,
            successful=False
        )
        
        count = LoginAttempt.get_recent_attempts(self.user, minutes=15)
        self.assertEqual(count, 1)
    
    def test_get_recent_attempts_excludes_successful_attempts(self):
        """Test that successful attempts are not counted"""
        # Create successful attempts
        for _ in range(5):
            LoginAttempt.objects.create(
                user=self.user,
                successful=True
            )
        
        count = LoginAttempt.get_recent_attempts(self.user, minutes=15)
        self.assertEqual(count, 0)
    
    def test_get_recent_attempts_different_users(self):
        """Test that attempts are isolated per user"""
        user2 = RegisteredUser.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="password123"
        )
        
        # Create attempts for both users
        LoginAttempt.objects.create(user=self.user, successful=False)
        LoginAttempt.objects.create(user=self.user, successful=False)
        LoginAttempt.objects.create(user=user2, successful=False)
        
        count_user1 = LoginAttempt.get_recent_attempts(self.user, minutes=15)
        count_user2 = LoginAttempt.get_recent_attempts(user2, minutes=15)
        
        self.assertEqual(count_user1, 2)
        self.assertEqual(count_user2, 1)


class HealthRatingModelTests(TestCase):
    """Unit tests for HealthRating model"""
    
    def setUp(self):
        self.dietitian = RegisteredUser.objects.create_user(
            username="dietitian",
            email="dietitian@example.com",
            password="password123",
            usertype=RegisteredUser.DIETITIAN
        )
        self.regular_user = RegisteredUser.objects.create_user(
            username="regular",
            email="regular@example.com",
            password="password123",
            usertype=RegisteredUser.USER
        )
        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=20,
            meal_type="dinner",
            creator=self.regular_user
        )
    
    def test_create_health_rating(self):
        """Test creating a health rating"""
        rating = HealthRating.objects.create(
            dietitian=self.dietitian,
            recipe=self.recipe,
            health_score=4.5,
            comment="Very healthy recipe"
        )
        self.assertEqual(rating.dietitian, self.dietitian)
        self.assertEqual(rating.recipe, self.recipe)
        self.assertEqual(rating.health_score, 4.5)
        self.assertEqual(rating.comment, "Very healthy recipe")
        self.assertIsNotNone(rating.timestamp)
    
    def test_health_rating_unique_together(self):
        """Test that a dietitian can only rate a recipe once"""
        HealthRating.objects.create(
            dietitian=self.dietitian,
            recipe=self.recipe,
            health_score=4.0
        )
        
        # Try to create another rating for the same dietitian-recipe pair
        with self.assertRaises(Exception):  # IntegrityError
            HealthRating.objects.create(
                dietitian=self.dietitian,
                recipe=self.recipe,
                health_score=5.0
            )
    
    def test_health_rating_min_value(self):
        """Test that health_score can be 0.0"""
        rating = HealthRating.objects.create(
            dietitian=self.dietitian,
            recipe=self.recipe,
            health_score=0.0
        )
        self.assertEqual(rating.health_score, 0.0)
    
    def test_health_rating_max_value(self):
        """Test that health_score can be 5.0"""
        rating = HealthRating.objects.create(
            dietitian=self.dietitian,
            recipe=self.recipe,
            health_score=5.0
        )
        self.assertEqual(rating.health_score, 5.0)
    
    def test_health_rating_comment_optional(self):
        """Test that comment field is optional"""
        rating = HealthRating.objects.create(
            dietitian=self.dietitian,
            recipe=self.recipe,
            health_score=3.5
        )
        self.assertIsNone(rating.comment)
    
    def test_multiple_dietitians_can_rate_same_recipe(self):
        """Test that different dietitians can rate the same recipe"""
        dietitian2 = RegisteredUser.objects.create_user(
            username="dietitian2",
            email="dietitian2@example.com",
            password="password123",
            usertype=RegisteredUser.DIETITIAN
        )
        
        rating1 = HealthRating.objects.create(
            dietitian=self.dietitian,
            recipe=self.recipe,
            health_score=4.0
        )
        rating2 = HealthRating.objects.create(
            dietitian=dietitian2,
            recipe=self.recipe,
            health_score=5.0
        )
        
        self.assertNotEqual(rating1.id, rating2.id)
        self.assertEqual(HealthRating.objects.filter(recipe=self.recipe).count(), 2)


class DietitianModelTests(TestCase):
    """Unit tests for Dietitian model"""
    
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username="dietitian",
            email="dietitian@example.com",
            password="password123",
            usertype=RegisteredUser.DIETITIAN
        )
    
    def test_create_dietitian(self):
        """Test creating a dietitian"""
        dietitian = Dietitian.objects.create(
            registered_user=self.user,
            certification_url="https://example.com/cert.pdf"
        )
        self.assertEqual(dietitian.registered_user, self.user)
        self.assertEqual(dietitian.certification_url, "https://example.com/cert.pdf")
    
    def test_dietitian_one_to_one_relationship(self):
        """Test that dietitian has one-to-one relationship with user"""
        Dietitian.objects.create(
            registered_user=self.user,
            certification_url="https://example.com/cert.pdf"
        )
        
        # Try to create another dietitian for the same user
        with self.assertRaises(Exception):  # IntegrityError
            Dietitian.objects.create(
                registered_user=self.user,
                certification_url="https://example.com/cert2.pdf"
            )
    
    def test_dietitian_reverse_relationship(self):
        """Test accessing dietitian from user"""
        dietitian = Dietitian.objects.create(
            registered_user=self.user,
            certification_url="https://example.com/cert.pdf"
        )
        self.assertEqual(self.user.dietitian, dietitian)


class RecipeRatingModelTests(TestCase):
    """Unit tests for RecipeRating model"""
    
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123"
        )
        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=20,
            meal_type="dinner",
            creator=self.user
        )
    
    def test_create_recipe_rating_with_both_ratings(self):
        """Test creating a rating with both taste and difficulty"""
        rating = RecipeRating.objects.create(
            user=self.user,
            recipe=self.recipe,
            taste_rating=4.5,
            difficulty_rating=3.0
        )
        self.assertEqual(rating.taste_rating, 4.5)
        self.assertEqual(rating.difficulty_rating, 3.0)
    
    def test_create_recipe_rating_with_only_taste(self):
        """Test creating a rating with only taste rating"""
        rating = RecipeRating.objects.create(
            user=self.user,
            recipe=self.recipe,
            taste_rating=4.0
        )
        self.assertEqual(rating.taste_rating, 4.0)
        self.assertIsNone(rating.difficulty_rating)
    
    def test_create_recipe_rating_with_only_difficulty(self):
        """Test creating a rating with only difficulty rating"""
        rating = RecipeRating.objects.create(
            user=self.user,
            recipe=self.recipe,
            difficulty_rating=2.5
        )
        self.assertIsNone(rating.taste_rating)
        self.assertEqual(rating.difficulty_rating, 2.5)
    
    def test_recipe_rating_unique_together(self):
        """Test that a user can only rate a recipe once"""
        RecipeRating.objects.create(
            user=self.user,
            recipe=self.recipe,
            taste_rating=4.0
        )
        
        # Try to create another rating for the same user-recipe pair
        with self.assertRaises(Exception):  # IntegrityError
            RecipeRating.objects.create(
                user=self.user,
                recipe=self.recipe,
                taste_rating=5.0
            )
    
    def test_recipe_rating_min_values(self):
        """Test that ratings can be 0.0"""
        rating = RecipeRating.objects.create(
            user=self.user,
            recipe=self.recipe,
            taste_rating=0.0,
            difficulty_rating=0.0
        )
        self.assertEqual(rating.taste_rating, 0.0)
        self.assertEqual(rating.difficulty_rating, 0.0)
    
    def test_recipe_rating_max_values(self):
        """Test that ratings can be 5.0"""
        rating = RecipeRating.objects.create(
            user=self.user,
            recipe=self.recipe,
            taste_rating=5.0,
            difficulty_rating=5.0
        )
        self.assertEqual(rating.taste_rating, 5.0)
        self.assertEqual(rating.difficulty_rating, 5.0)


class RegisteredUserModelEdgeCasesTests(TestCase):
    """Unit tests for RegisteredUser model edge cases"""
    
    def test_user_language_choices(self):
        """Test language field choices"""
        user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123",
            language="en"
        )
        self.assertEqual(user.language, "en")
        
        user.language = "tr"
        user.save()
        self.assertEqual(user.language, "tr")
    
    def test_user_date_format_choices(self):
        """Test preferredDateFormat field choices"""
        user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123",
            preferredDateFormat="MM/DD/YYYY"
        )
        self.assertEqual(user.preferredDateFormat, "MM/DD/YYYY")
        
        user.preferredDateFormat = "DD/MM/YYYY"
        user.save()
        self.assertEqual(user.preferredDateFormat, "DD/MM/YYYY")
    
    def test_user_currency_choices(self):
        """Test preferredCurrency field choices"""
        user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123",
            preferredCurrency="USD"
        )
        self.assertEqual(user.preferredCurrency, "USD")
        
        user.preferredCurrency = "EUR"
        user.save()
        self.assertEqual(user.preferredCurrency, "EUR")
    
    def test_user_accessibility_needs(self):
        """Test accessibilityNeeds field choices"""
        user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123",
            accessibilityNeeds="none"
        )
        self.assertEqual(user.accessibilityNeeds, "none")
        
        user.accessibilityNeeds = "colorblind"
        user.save()
        self.assertEqual(user.accessibilityNeeds, "colorblind")
    
    def test_user_date_of_birth_optional(self):
        """Test that date_of_birth is optional"""
        user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123"
        )
        self.assertIsNone(user.date_of_birth)
    
    def test_user_nationality_optional(self):
        """Test that nationality is optional"""
        user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123"
        )
        self.assertIsNone(user.nationality)
    
    def test_user_recipe_count_default(self):
        """Test that recipeCount defaults to 0"""
        user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123"
        )
        self.assertEqual(user.recipeCount, 0)
    
    def test_user_avg_recipe_rating_default(self):
        """Test that avgRecipeRating defaults to 0.0"""
        user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123"
        )
        self.assertEqual(user.avgRecipeRating, 0.0)
    
    def test_user_email_uniqueness(self):
        """Test that email must be unique"""
        RegisteredUser.objects.create_user(
            username="user1",
            email="test@example.com",
            password="password123"
        )
        
        with self.assertRaises(Exception):  # IntegrityError
            RegisteredUser.objects.create_user(
                username="user2",
                email="test@example.com",
                password="password123"
            )


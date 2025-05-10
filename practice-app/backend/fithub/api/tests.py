from django.test import TestCase
from django.core.exceptions import ValidationError
from django.urls import reverse
from api.models import RegisteredUser, RecipeRating
from recipes.models import Recipe
from datetime import datetime
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
import json

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

class RateRecipeTests(APITestCase):
    def setUp(self):
        # Create test users
        self.user = RegisteredUser.objects.create_user(
            username='chef123',
            email='chef@test.com',
            password='testpass123'
        )
        self.other_user = RegisteredUser.objects.create_user(
            username='foodie456',
            email='foodie@test.com',
            password='testpass123'
        )
        self.third_user = RegisteredUser.objects.create_user(
            username='third',
            email='third@test.com',
            password='testpass123'
        )
        self.fourth_user = RegisteredUser.objects.create_user(
            username='four',
            email='fourfourtwo@test.com',
            password='testpass123'
        )

        # Create test recipe
        self.recipe = Recipe.objects.create(
            name="Tomato Sandwich",
            steps=json.dumps(["Spread butter", "Add tomato slices", "Serve"]),
            prep_time=10,
            cook_time=0,
            meal_type="lunch",
            creator=self.user
        )
        
        # Generate JWT tokens
        self.user_token = str(RefreshToken.for_user(self.user).access_token)
        self.other_user_token = str(RefreshToken.for_user(self.other_user).access_token)
        self.third_user_token = str(RefreshToken.for_user(self.third_user).access_token)
        self.fourth_user_token = str(RefreshToken.for_user(self.fourth_user).access_token)

    def get_authenticated_client(self, token):
        client = self.client
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return client

    def test_rate_recipe_success(self):
        """Test successful rating submission"""
        url = reverse('registereduser-rate-recipe')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user_token}')
        
        data = {
            'recipe_id': self.recipe.id,
            'taste_rating': 4.5,
            'difficulty_rating': 3.0
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the returned data structure
        self.assertIn('id', response.data)
        self.assertIn('taste_rating', response.data)
        self.assertIn('difficulty_rating', response.data)
        self.assertEqual(response.data['taste_rating'], 4.5)
        self.assertEqual(response.data['difficulty_rating'], 3.0)
        
        # Verify rating was created
        rating = RecipeRating.objects.first()
        self.assertEqual(rating.taste_rating, 4.5)
        self.assertEqual(rating.difficulty_rating, 3.0)

    def test_rate_recipe_invalid_jwt(self):
        """Test rating with invalid/expired JWT"""
        url = reverse('registereduser-rate-recipe')
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalidtoken123')
        
        data = {
            'recipe_id': self.recipe.id,
            'taste_rating': 3.0,
            'difficulty_rating': 3.0
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_rate_recipe_minimum_values(self):
        """Test minimum allowed rating values"""
        url = reverse('registereduser-rate-recipe')
        client = self.get_authenticated_client(self.other_user_token)
        
        
        data = {
            'recipe_id': self.recipe.id,
            'taste_rating': 0.0,
            'difficulty_rating': 0.0
        }
        response = client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_rate_recipe_maximum_values(self):
        """Test maximum allowed rating values"""
        url = reverse('registereduser-rate-recipe')
        client = self.get_authenticated_client(self.other_user_token)
        
        
        data = {
            'recipe_id': self.recipe.id,
            'taste_rating': 5.0,
            'difficulty_rating': 5.0
        }
        response = client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_rate_recipe_updates_recipe_stats(self):
        """Test that rating updates the recipe's average ratings"""
        url = reverse('registereduser-rate-recipe')
        client = self.get_authenticated_client(self.other_user_token)
        
        initial_taste_avg = self.recipe.taste_rating
        initial_difficulty_avg = self.recipe.difficulty_rating
        
        data = {
            'recipe_id': self.recipe.id,
            'taste_rating': 4.0,
            'difficulty_rating': 2.0
        }
        
        response = client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh recipe from DB
        self.recipe.refresh_from_db()
        
        # Verify averages were updated
        self.assertNotEqual(initial_taste_avg, self.recipe.taste_rating)
        self.assertNotEqual(initial_difficulty_avg, self.recipe.difficulty_rating)
        self.assertEqual(self.recipe.difficulty_rating_count, 1)
        self.assertEqual(self.recipe.taste_rating_count, 1)

    def test_multiple_users_can_rate_same_recipe(self):
        """Test that different users can rate the same recipe"""
        url = reverse('registereduser-rate-recipe')
        
        # First user rates
        client1 = self.get_authenticated_client(self.user_token)
        data1 = {
            'recipe_id': self.recipe.id,
            'taste_rating': 5.0,
            'difficulty_rating': 1.0
        }
        response1 = client1.post(url, data1, format='json')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Second user rates
        client2 = self.get_authenticated_client(self.other_user_token)
        data2 = {
            'recipe_id': self.recipe.id,
            'taste_rating': 4.0,
            'difficulty_rating': 3.0
        }
        response2 = client2.post(url, data2, format='json')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # Verify both ratings exist
        ratings = RecipeRating.objects.filter(recipe=self.recipe)
        self.assertEqual(ratings.count(), 2)
        
        # Verify recipe stats were updated
        self.recipe.refresh_from_db()
        self.assertEqual(self.recipe.taste_rating_count, 2)
        self.assertEqual(self.recipe.difficulty_rating_count, 2)


#TESTS FOR RECIPE RATING VIEW SET

class RecipeRatingTests(APITestCase):
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.other_user = RegisteredUser.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        
        # Create test recipe
        self.recipe = Recipe.objects.create(
            name="Tomato Sandwich",
            steps=["Spread butter", "Add tomato slices", "Serve"],
            prep_time=10,
            cook_time=0,
            meal_type="lunch",
            creator=self.user
        )

        self.recipe2 = Recipe.objects.create(
            name="Tomato Sandwich2",
            steps=["Spread butter", "Add tomato slices", "Serve"],
            prep_time=10,
            cook_time=0,
            meal_type="lunch",
            creator=self.user
        )
        
        # Generate tokens
        self.token = str(RefreshToken.for_user(self.user).access_token)
        self.other_token = str(RefreshToken.for_user(self.other_user).access_token)
        
        # API client setup
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    # --- CREATE TESTS ---
    def test_create_rating_success(self):
        """Test successful rating creation"""
        url = reverse('reciperating-list')
        data = {
            'recipe_id': self.recipe.id,
            'taste_rating': 4.5,
            'difficulty_rating': 3.0
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RecipeRating.objects.count(), 1)
        
        # Verify recipe stats updated
        self.recipe.refresh_from_db()
        self.assertEqual(self.recipe.taste_rating, 4.5)
        self.assertEqual(self.recipe.taste_rating_count, 1)
        self.assertEqual(self.recipe.difficulty_rating, 3.0)
        self.assertEqual(self.recipe.difficulty_rating_count, 1)

    def test_create_partial_rating(self):
        """Test creating rating with only one rating field"""
        url = reverse('reciperating-list')
        
        # Only taste rating
        data = {'recipe_id': self.recipe.id, 'taste_rating': 4.0}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Only difficulty rating
        data = {'recipe_id': self.recipe2.id, 'difficulty_rating': 2.0}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    

    # --- DELETE TESTS ---
    def test_delete_rating(self):
        """Test rating deletion updates recipe stats"""
        rating = RecipeRating.objects.create(
            user=self.user,
            recipe=self.recipe,
            taste_rating=4.0,
            difficulty_rating=3.0
        )
        self.recipe.update_ratings('taste', 4.0)
        self.recipe.update_ratings('difficulty', 3.0)
        
        url = reverse('reciperating-detail', args=[rating.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify recipe stats reset
        self.recipe.refresh_from_db()
        self.assertIsNone(self.recipe.taste_rating)
        self.assertIsNone(self.recipe.difficulty_rating)
        self.assertEqual(self.recipe.taste_rating_count, 0)
        self.assertEqual(self.recipe.difficulty_rating_count, 0)

    
    # --- EDGE CASES ---

    def test_last_rating_deletion(self):
        """Test deleting the last rating for a recipe"""
        rating = RecipeRating.objects.create(
            user=self.user,
            recipe=self.recipe,
            taste_rating=4.0,
            difficulty_rating=3.0
        )
        self.recipe.update_ratings('taste', 4.0)
        self.recipe.update_ratings('difficulty', 3.0)
        
        url = reverse('reciperating-detail', args=[rating.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify all stats reset
        self.recipe.refresh_from_db()
        self.assertIsNone(self.recipe.taste_rating)
        self.assertIsNone(self.recipe.difficulty_rating)
        self.assertEqual(self.recipe.taste_rating_count, 0)
        self.assertEqual(self.recipe.difficulty_rating_count, 0)

    # --- PERMISSION TESTS ---
    def test_cannot_modify_others_ratings(self):
        """Test users can't modify others' ratings"""
        rating = RecipeRating.objects.create(
            user=self.other_user,
            recipe=self.recipe,
            taste_rating=3.0,
            difficulty_rating=2.0
        )
        
        # Try to update
        url = reverse('reciperating-detail', args=[rating.id])
        data = {'taste_rating': 5.0}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Try to delete
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
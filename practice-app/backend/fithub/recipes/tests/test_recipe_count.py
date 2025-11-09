from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from recipes.models import Recipe

class RecipeCountTests(APITestCase):
    def setUp(self):
        # Create test users
        self.user1 = get_user_model().objects.create_user(
            username='testuser1',
            email='test1@example.com',
            password='testpass123'
        )
        self.user2 = get_user_model().objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )

        # Create test recipes
        Recipe.objects.create(
            title='Recipe 1',
            description='Test Recipe 1',
            instructions='Test Instructions 1',
            creator=self.user1
        )
        Recipe.objects.create(
            title='Recipe 2',
            description='Test Recipe 2',
            instructions='Test Instructions 2',
            creator=self.user1
        )
        Recipe.objects.create(
            title='Recipe 3',
            description='Test Recipe 3',
            instructions='Test Instructions 3',
            creator=self.user2
        )

    def test_get_user_recipe_count(self):
        """
        Test getting recipe count for a specific user
        """
        url = reverse('user-recipe-count', kwargs={'user_id': self.user1.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['recipe_count'], 2)
        self.assertEqual(response.data['user_id'], self.user1.id)

    def test_get_user_recipe_count_no_recipes(self):
        """
        Test getting recipe count for a user with no recipes
        """
        user3 = get_user_model().objects.create_user(
            username='testuser3',
            email='test3@example.com',
            password='testpass123'
        )

        url = reverse('user-recipe-count', kwargs={'user_id': user3.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['recipe_count'], 0)
        self.assertEqual(response.data['user_id'], user3.id)

    def test_get_user_recipe_count_invalid_user(self):
        """
        Test getting recipe count for a non-existent user
        """
        invalid_user_id = 9999
        url = reverse('user-recipe-count', kwargs={'user_id': invalid_user_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['recipe_count'], 0)
        self.assertEqual(response.data['user_id'], invalid_user_id)
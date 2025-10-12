from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from recipes.models import Recipe
from ingredients.models import Ingredient
from forum.models import ForumPost, ForumPostComment

User = get_user_model()

class AnalyticsViewTest(TestCase):

    def setUp(self):
        # Initialize API client
        self.client = APIClient()

        # Create some sample data
        self.user = User.objects.create_user(username='testuser', password='password')

        # Recipes
        Recipe.objects.create(name='Recipe 1', creator=self.user, prep_time=10, cook_time=20, meal_type='breakfast')
        Recipe.objects.create(name='Recipe 2', creator=self.user, prep_time=15, cook_time=25, meal_type='lunch')


        # Ingredients
        Ingredient.objects.create(name='Ingredient 1')
        Ingredient.objects.create(name='Ingredient 2')
        Ingredient.objects.create(name='Ingredient 3')

        # Forum posts
        self.post1 = ForumPost.objects.create(title='Post 1', author=self.user)
        self.post2 = ForumPost.objects.create(title='Post 2', author=self.user)

        # Comments
        ForumPostComment.objects.create(content='Comment 1', author=self.user, post=self.post1)
        ForumPostComment.objects.create(content='Comment 2', author=self.user, post=self.post1)
        ForumPostComment.objects.create(content='Comment 3', author=self.user, post=self.post2)

    def test_analytics_endpoint(self):
        # Call the /analytics/ endpoint
        response = self.client.get('/analytics/analytics/')

        # Check status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check response contains expected fields
        expected_fields = ['users_count', 'recipes_count', 'ingredients_count', 'posts_count', 'comments_count']
        for field in expected_fields:
            self.assertIn(field, response.data)
            self.assertIsInstance(response.data[field], int)

        # Optionally, check actual counts match what we created
        self.assertEqual(response.data['users_count'], 1)
        self.assertEqual(response.data['recipes_count'], 2)
        self.assertEqual(response.data['ingredients_count'], 3)
        self.assertEqual(response.data['posts_count'], 2)
        self.assertEqual(response.data['comments_count'], 3)

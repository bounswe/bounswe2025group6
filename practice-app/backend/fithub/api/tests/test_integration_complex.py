"""
Complex Workflow and Performance Integration Tests for Fithub Backend

These tests cover complex multi-step workflows that involve multiple components
working together, simulating real-world usage scenarios.
"""
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.db import transaction
from rest_framework.test import APIClient
from rest_framework import status
import json
import time

from api.models import RegisteredUser
from recipes.models import Recipe, RecipeIngredient, RecipeLike
from ingredients.models import Ingredient
from forum.models import ForumPost, ForumPostComment
from reports.models import Report
from django.contrib.contenttypes.models import ContentType


class ComplexWorkflowTests(TransactionTestCase):
    """Complex multi-step workflow tests"""
    
    def setUp(self):
        self.client = APIClient()
        # Create multiple users for complex interactions
        self.user1 = RegisteredUser.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='pass123'
        )
        self.user1.is_active = True
        self.user1.save()

        self.user2 = RegisteredUser.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='pass123'
        )
        self.user2.is_active = True
        self.user2.save()

        self.user3 = RegisteredUser.objects.create_user(
            username='user3',
            email='user3@example.com',
            password='pass123'
        )
        self.user3.is_active = True
        self.user3.save()

        # Create ingredients
        self.ingredient1 = Ingredient.objects.create(
            name='Flour',
            allowed_units=['g', 'kg', 'cup'],
            base_unit='g'
        )
        self.ingredient2 = Ingredient.objects.create(
            name='Sugar',
            allowed_units=['g', 'kg', 'tbsp'],
            base_unit='g'
        )
        self.ingredient3 = Ingredient.objects.create(
            name='Eggs',
            allowed_units=['pcs'],
            base_unit='pcs'
        )

    def test_complete_recipe_sharing_workflow(self):
        """Test complete workflow: create recipe -> share -> others interact"""
        self.client.force_authenticate(user=self.user1)

        # Step 1: User1 creates a recipe
        recipe_url = reverse('recipe-list')
        recipe_data = {
            'name': 'Shared Chocolate Cake',
            'steps': json.dumps([
                'Mix dry ingredients',
                'Add wet ingredients',
                'Bake at 350F for 30 minutes'
            ]),
            'prep_time': 15,
            'cook_time': 30,
            'meal_type': 'dinner',
            'ingredients': json.dumps([
                {'ingredient_name': 'Flour', 'quantity': 200, 'unit': 'g'},
                {'ingredient_name': 'Sugar', 'quantity': 150, 'unit': 'g'},
                {'ingredient_name': 'Eggs', 'quantity': 3, 'unit': 'pcs'}
            ])
        }
        response = self.client.post(recipe_url, recipe_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        recipe_id = response.data.get('id')
        self.assertIsNotNone(recipe_id)

        # Step 2: User2 views the recipe
        self.client.force_authenticate(user=self.user2)
        detail_url = reverse('recipe-detail', kwargs={'pk': recipe_id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Shared Chocolate Cake')

        # Step 3: User2 likes the recipe
        like = RecipeLike.objects.create(recipe_id=recipe_id, user=self.user2)
        recipe = Recipe.objects.get(id=recipe_id)
        self.assertEqual(recipe.like_count, 1)

        # Step 4: User2 bookmarks the recipe
        bookmark_url = reverse('registereduser-bookmark-recipe')
        response = self.client.post(
            bookmark_url,
            {'recipe_id': recipe_id},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Step 5: User2 rates the recipe
        rating_url = reverse('reciperating-list')
        rating_data = {
            'recipe_id': recipe_id,
            'taste_rating': 4.5,
            'difficulty_rating': 3.0
        }
        response = self.client.post(rating_url, rating_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Step 6: User3 also likes and rates
        self.client.force_authenticate(user=self.user3)
        RecipeLike.objects.create(recipe_id=recipe_id, user=self.user3)
        rating_data = {
            'recipe_id': recipe_id,
            'taste_rating': 5.0,
            'difficulty_rating': 2.5
        }
        response = self.client.post(rating_url, rating_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Step 7: Verify aggregated stats
        recipe.refresh_from_db()
        self.assertEqual(recipe.like_count, 2)
        # Average taste rating should be (4.5 + 5.0) / 2 = 4.75
        self.assertIsNotNone(recipe.taste_rating)
        self.assertGreater(recipe.taste_rating, 4.0)

    def test_multi_user_forum_discussion_workflow(self):
        """Test complex forum discussion with multiple users"""
        # Step 1: User1 creates a forum post
        self.client.force_authenticate(user=self.user1)
        post_url = reverse('forum-post-list')
        post_data = {
            'title': 'Best Recipe for Beginners?',
            'content': 'What recipe would you recommend for someone just starting to cook?',
            'tags': ['Tips', 'Student']
        }
        response = self.client.post(post_url, post_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        post_id = response.data['id']

        # Step 2: User2 comments on the post
        self.client.force_authenticate(user=self.user2)
        comment_url = reverse('forumpostcomment-list-create', kwargs={'post_id': post_id})
        comment1_data = {'content': 'I recommend starting with pasta dishes!'}
        response = self.client.post(comment_url, comment1_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        comment1_id = response.data['id']

        # Step 3: User3 also comments
        self.client.force_authenticate(user=self.user3)
        comment2_data = {'content': 'Scrambled eggs are great for beginners!'}
        response = self.client.post(comment_url, comment2_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        comment2_id = response.data['id']

        # Step 4: User1 votes on comments
        self.client.force_authenticate(user=self.user1)
        vote_url = reverse('comment-vote', kwargs={'comment_id': comment1_id})
        response = self.client.post(vote_url, {'vote_type': 'up'}, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

        # Step 5: User2 votes on the post
        self.client.force_authenticate(user=self.user2)
        post_vote_url = reverse('post-vote', kwargs={'post_id': post_id})
        response = self.client.post(post_vote_url, {'vote_type': 'up'}, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

        # Step 6: Verify post has comments
        detail_url = reverse('forum-post-detail', kwargs={'pk': post_id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Post should have 2 comments
        comments = ForumPostComment.objects.filter(post_id=post_id, deleted_on__isnull=True)
        self.assertEqual(comments.count(), 2)

    def test_recipe_creation_with_multiple_ingredients_performance(self):
        """Test creating recipe with many ingredients (performance test)"""
        self.client.force_authenticate(user=self.user1)

        # Create many ingredients
        ingredients = []
        for i in range(20):
            ing = Ingredient.objects.create(
                name=f'Ingredient{i}',
                allowed_units=['g', 'kg'],
                base_unit='g'
            )
            ingredients.append(ing)

        # Create recipe with all ingredients
        recipe_url = reverse('recipe-list')
        ingredients_list = [
            {'ingredient_name': ing.name, 'quantity': 100 + i, 'unit': 'g'}
            for i, ing in enumerate(ingredients)
        ]
        recipe_data = {
            'name': 'Complex Recipe with Many Ingredients',
            'steps': json.dumps(['Step 1', 'Step 2', 'Step 3']),
            'prep_time': 30,
            'cook_time': 60,
            'meal_type': 'dinner',
            'ingredients': json.dumps(ingredients_list)
        }

        start_time = time.time()
        response = self.client.post(recipe_url, recipe_data, format='multipart')
        elapsed_time = time.time() - start_time

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Recipe creation with 20 ingredients should complete in reasonable time (< 5 seconds)
        self.assertLess(elapsed_time, 5.0, "Recipe creation took too long")

        # Verify all ingredients were linked
        recipe_id = response.data.get('id')
        recipe_ingredients = RecipeIngredient.objects.filter(recipe_id=recipe_id)
        self.assertEqual(recipe_ingredients.count(), 20)

    def test_concurrent_likes_performance(self):
        """Test performance of concurrent likes on a recipe"""
        recipe = Recipe.objects.create(
            name='Popular Recipe',
            steps=['Step 1'],
            prep_time=5,
            cook_time=10,
            meal_type='lunch',
            creator=self.user1
        )

        # Simulate multiple users liking simultaneously
        users = []
        for i in range(10):
            user = RegisteredUser.objects.create_user(
                username=f'liker{i}',
                email=f'liker{i}@example.com',
                password='pass123'
            )
            user.is_active = True
            user.save()
            users.append(user)

        start_time = time.time()
        # Create likes for all users
        for user in users:
            RecipeLike.objects.create(recipe=recipe, user=user)
        elapsed_time = time.time() - start_time

        # Verify all likes were created
        recipe.refresh_from_db()
        self.assertEqual(recipe.like_count, 10)
        # Should complete quickly (< 1 second for 10 likes)
        self.assertLess(elapsed_time, 1.0, "Likes creation took too long")

    def test_user_follow_network_workflow(self):
        """Test complex follow network creation"""
        # Create a network: user1 follows user2 and user3, user2 follows user3
        self.client.force_authenticate(user=self.user1)
        follow_url = reverse('registereduser-follow')

        # User1 follows User2
        response = self.client.post(follow_url, {'user_id': self.user2.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # User1 follows User3
        response = self.client.post(follow_url, {'user_id': self.user3.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # User2 follows User3
        self.client.force_authenticate(user=self.user2)
        response = self.client.post(follow_url, {'user_id': self.user3.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify follow relationships
        self.user1.refresh_from_db()
        self.user2.refresh_from_db()
        self.user3.refresh_from_db()

        self.assertIn(self.user2, self.user1.followedUsers.all())
        self.assertIn(self.user3, self.user1.followedUsers.all())
        self.assertIn(self.user3, self.user2.followedUsers.all())

        # Verify follower counts
        self.assertEqual(self.user2.followers.count(), 1)  # User1 follows User2
        self.assertEqual(self.user3.followers.count(), 2)  # User1 and User2 follow User3

    def test_recipe_modification_workflow(self):
        """Test complex recipe modification workflow"""
        self.client.force_authenticate(user=self.user1)

        # Step 1: Create initial recipe
        recipe_url = reverse('recipe-list')
        recipe_data = {
            'name': 'Original Recipe',
            'steps': json.dumps(['Original step']),
            'prep_time': 10,
            'cook_time': 15,
            'meal_type': 'lunch',
            'ingredients': json.dumps([
                {'ingredient_name': 'Flour', 'quantity': 100, 'unit': 'g'}
            ])
        }
        response = self.client.post(recipe_url, recipe_data, format='multipart')
        recipe_id = response.data.get('id')

        # Step 2: User2 likes it
        self.client.force_authenticate(user=self.user2)
        RecipeLike.objects.create(recipe_id=recipe_id, user=self.user2)

        # Step 3: User1 updates the recipe
        self.client.force_authenticate(user=self.user1)
        update_url = reverse('recipe-detail', kwargs={'pk': recipe_id})
        update_data = {
            'name': 'Updated Recipe',
            'steps': json.dumps(['Updated step 1', 'Updated step 2']),
            'prep_time': 15,
            'cook_time': 20,
            'meal_type': 'dinner'
        }
        response = self.client.put(update_url, update_data, format='multipart')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

        # Step 4: Verify like count is preserved
        recipe = Recipe.objects.get(id=recipe_id)
        self.assertEqual(recipe.like_count, 1)
        self.assertEqual(recipe.name, 'Updated Recipe')

    def test_report_and_resolution_workflow(self):
        """Test complete report and resolution workflow"""
        # Step 1: User1 creates a recipe
        self.client.force_authenticate(user=self.user1)
        recipe_url = reverse('recipe-list')
        recipe_data = {
            'name': 'Reported Recipe',
            'steps': json.dumps(['Step 1']),
            'prep_time': 5,
            'cook_time': 10,
            'meal_type': 'lunch',
            'ingredients': json.dumps([])
        }
        response = self.client.post(recipe_url, recipe_data, format='multipart')
        recipe_id = response.data.get('id')

        # Step 2: User2 reports it
        self.client.force_authenticate(user=self.user2)
        report_url = reverse('reports-list')
        report_data = {
            'content_type': 'recipe',
            'object_id': recipe_id,
            'report_type': 'spam',
            'description': 'This looks like spam'
        }
        response = self.client.post(report_url, report_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Step 3: Admin reviews and resolves (keeps content)
        admin = RegisteredUser.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        admin.is_active = True
        admin.is_staff = True
        admin.save()
        self.client.force_authenticate(user=admin)

        report = Report.objects.filter(
            content_type=ContentType.objects.get_for_model(Recipe),
            object_id=recipe_id
        ).latest('created_at')
        resolve_url = reverse('admin-reports-resolve-keep', kwargs={'pk': report.id})
        response = self.client.post(resolve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Step 4: Verify recipe still exists
        recipe = Recipe.objects.get(id=recipe_id)
        self.assertIsNotNone(recipe)
        report.refresh_from_db()
        self.assertEqual(report.status, 'resolved')

    def test_bulk_recipe_operations(self):
        """Test creating and managing multiple recipes"""
        self.client.force_authenticate(user=self.user1)
        recipe_url = reverse('recipe-list')

        # Create 5 recipes
        recipe_ids = []
        for i in range(5):
            recipe_data = {
                'name': f'Recipe {i+1}',
                'steps': json.dumps([f'Step {j+1}' for j in range(3)]),
                'prep_time': 10 + i,
                'cook_time': 15 + i,
                'meal_type': ['breakfast', 'lunch', 'dinner', 'breakfast', 'lunch'][i],
                'ingredients': json.dumps([])
            }
            response = self.client.post(recipe_url, recipe_data, format='multipart')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            recipe_ids.append(response.data.get('id'))

        # Verify all recipes were created
        self.assertEqual(len(recipe_ids), 5)
        recipes = Recipe.objects.filter(creator=self.user1, deleted_on__isnull=True)
        self.assertEqual(recipes.count(), 5)

        # Filter by meal_type
        list_url = reverse('recipe-list')
        response = self.client.get(list_url, {'meal_type': 'breakfast'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        breakfast_recipes = [r for r in results if r.get('meal_type') == 'breakfast']
        self.assertGreaterEqual(len(breakfast_recipes), 2)  # At least 2 breakfast recipes

    def test_recipe_with_nutrition_calculation(self):
        """Test recipe creation with ingredients that have nutrition info"""
        # Create ingredients with nutrition info
        ingredient = Ingredient.objects.create(
            name='Test Ingredient',
            allowed_units=['g'],
            base_unit='g',
            calories=100,
            protein=10,
            fat=5,
            carbs=15,
            base_quantity=100  # Per 100g
        )

        self.client.force_authenticate(user=self.user1)
        recipe_url = reverse('recipe-list')
        recipe_data = {
            'name': 'Nutritional Recipe',
            'steps': json.dumps(['Mix ingredients']),
            'prep_time': 10,
            'cook_time': 20,
            'meal_type': 'lunch',
            'ingredients': json.dumps([
                {'ingredient_name': 'Test Ingredient', 'quantity': 200, 'unit': 'g'}
            ])
        }
        response = self.client.post(recipe_url, recipe_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify nutrition info is calculated
        recipe_id = response.data.get('id')
        detail_url = reverse('recipe-detail', kwargs={'pk': recipe_id})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Recipe should have calculated nutrition info
        nutrition = response.data.get('recipe_nutritions', {})
        # 200g of ingredient with 100 cal/100g = 200 calories
        self.assertIsNotNone(nutrition.get('calories'))
        self.assertGreater(nutrition.get('calories', 0), 0)


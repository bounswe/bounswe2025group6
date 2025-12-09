"""
Test cases for fast user IDs endpoints:
- get_user_recipe_ids
- get_user_comment_ids  
- get_user_post_ids
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone

from api.models import RegisteredUser
from recipes.models import Recipe
from forum.models import ForumPost, ForumPostComment


class UserRecipeIdsEndpointTests(APITestCase):
    """Test cases for GET /api/users/{user_id}/recipe-ids/"""
    
    def setUp(self):
        """Set up test data"""
        self.user1 = RegisteredUser.objects.create_user(
            username='user1',
            email='user1@test.com',
            password='testpass123'
        )
        self.user2 = RegisteredUser.objects.create_user(
            username='user2',
            email='user2@test.com',
            password='testpass123'
        )
        
        # Create recipes for user1
        self.recipe1 = Recipe.objects.create(
            name='Recipe 1',
            steps=['Step 1', 'Step 2'],
            prep_time=10,
            cook_time=20,
            meal_type='lunch',
            creator=self.user1
        )
        self.recipe2 = Recipe.objects.create(
            name='Recipe 2',
            steps=['Step 1'],
            prep_time=5,
            cook_time=15,
            meal_type='dinner',
            creator=self.user1
        )
        
        # Create recipe for user2
        self.recipe3 = Recipe.objects.create(
            name='Recipe 3',
            steps=['Step 1'],
            prep_time=5,
            cook_time=10,
            meal_type='breakfast',
            creator=self.user2
        )
        
        # Create soft-deleted recipe for user1 (should not be included)
        self.deleted_recipe = Recipe.objects.create(
            name='Deleted Recipe',
            steps=['Step 1'],
            prep_time=5,
            cook_time=10,
            meal_type='lunch',
            creator=self.user1,
            deleted_on=timezone.now()
        )
    
    def test_get_user_recipe_ids_success(self):
        """Test successfully retrieving recipe IDs for a user"""
        url = reverse('get-user-recipe-ids', kwargs={'user_id': self.user1.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('recipe_ids', response.data)
        self.assertIsInstance(response.data['recipe_ids'], list)
        self.assertEqual(len(response.data['recipe_ids']), 2)
        self.assertIn(self.recipe1.id, response.data['recipe_ids'])
        self.assertIn(self.recipe2.id, response.data['recipe_ids'])
        self.assertNotIn(self.deleted_recipe.id, response.data['recipe_ids'])
    
    def test_get_user_recipe_ids_empty(self):
        """Test retrieving recipe IDs for a user with no recipes"""
        new_user = RegisteredUser.objects.create_user(
            username='newuser',
            email='newuser@test.com',
            password='testpass123'
        )
        url = reverse('get-user-recipe-ids', kwargs={'user_id': new_user.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('recipe_ids', response.data)
        self.assertEqual(response.data['recipe_ids'], [])
    
    def test_get_user_recipe_ids_user_not_found(self):
        """Test retrieving recipe IDs for non-existent user"""
        url = reverse('get-user-recipe-ids', kwargs={'user_id': 99999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'User not found')
    
    def test_get_user_recipe_ids_excludes_other_users_recipes(self):
        """Test that only the specified user's recipes are returned"""
        url = reverse('get-user-recipe-ids', kwargs={'user_id': self.user1.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.recipe3.id, response.data['recipe_ids'])
    
    def test_get_user_recipe_ids_excludes_soft_deleted(self):
        """Test that soft-deleted recipes are not included"""
        url = reverse('get-user-recipe-ids', kwargs={'user_id': self.user1.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.deleted_recipe.id, response.data['recipe_ids'])


class UserCommentIdsEndpointTests(APITestCase):
    """Test cases for GET /api/users/{user_id}/comment-ids/"""
    
    def setUp(self):
        """Set up test data"""
        self.user1 = RegisteredUser.objects.create_user(
            username='user1',
            email='user1@test.com',
            password='testpass123'
        )
        self.user2 = RegisteredUser.objects.create_user(
            username='user2',
            email='user2@test.com',
            password='testpass123'
        )
        
        # Create a post for comments
        self.post = ForumPost.objects.create(
            title='Test Post',
            content='Test content',
            author=self.user1
        )
        
        # Create comments for user1
        self.comment1 = ForumPostComment.objects.create(
            post=self.post,
            author=self.user1,
            content='Comment 1 by user1'
        )
        self.comment2 = ForumPostComment.objects.create(
            post=self.post,
            author=self.user1,
            content='Comment 2 by user1'
        )
        
        # Create comment for user2
        self.comment3 = ForumPostComment.objects.create(
            post=self.post,
            author=self.user2,
            content='Comment by user2'
        )
        
        # Create soft-deleted comment for user1 (should not be included)
        self.deleted_comment = ForumPostComment.objects.create(
            post=self.post,
            author=self.user1,
            content='Deleted comment',
            deleted_on=timezone.now()
        )
    
    def test_get_user_comment_ids_success(self):
        """Test successfully retrieving comment IDs for a user"""
        url = reverse('get-user-comment-ids', kwargs={'user_id': self.user1.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('comment_ids', response.data)
        self.assertIsInstance(response.data['comment_ids'], list)
        self.assertEqual(len(response.data['comment_ids']), 2)
        self.assertIn(self.comment1.id, response.data['comment_ids'])
        self.assertIn(self.comment2.id, response.data['comment_ids'])
        self.assertNotIn(self.deleted_comment.id, response.data['comment_ids'])
    
    def test_get_user_comment_ids_empty(self):
        """Test retrieving comment IDs for a user with no comments"""
        new_user = RegisteredUser.objects.create_user(
            username='newuser',
            email='newuser@test.com',
            password='testpass123'
        )
        url = reverse('get-user-comment-ids', kwargs={'user_id': new_user.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('comment_ids', response.data)
        self.assertEqual(response.data['comment_ids'], [])
    
    def test_get_user_comment_ids_user_not_found(self):
        """Test retrieving comment IDs for non-existent user"""
        url = reverse('get-user-comment-ids', kwargs={'user_id': 99999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'User not found')
    
    def test_get_user_comment_ids_excludes_other_users_comments(self):
        """Test that only the specified user's comments are returned"""
        url = reverse('get-user-comment-ids', kwargs={'user_id': self.user1.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.comment3.id, response.data['comment_ids'])
    
    def test_get_user_comment_ids_excludes_soft_deleted(self):
        """Test that soft-deleted comments are not included"""
        url = reverse('get-user-comment-ids', kwargs={'user_id': self.user1.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.deleted_comment.id, response.data['comment_ids'])


class UserPostIdsEndpointTests(APITestCase):
    """Test cases for GET /api/users/{user_id}/post-ids/"""
    
    def setUp(self):
        """Set up test data"""
        self.user1 = RegisteredUser.objects.create_user(
            username='user1',
            email='user1@test.com',
            password='testpass123'
        )
        self.user2 = RegisteredUser.objects.create_user(
            username='user2',
            email='user2@test.com',
            password='testpass123'
        )
        
        # Create posts for user1
        self.post1 = ForumPost.objects.create(
            title='Post 1',
            content='Content 1',
            author=self.user1
        )
        self.post2 = ForumPost.objects.create(
            title='Post 2',
            content='Content 2',
            author=self.user1
        )
        
        # Create post for user2
        self.post3 = ForumPost.objects.create(
            title='Post 3',
            content='Content 3',
            author=self.user2
        )
        
        # Create soft-deleted post for user1 (should not be included)
        self.deleted_post = ForumPost.objects.create(
            title='Deleted Post',
            content='Deleted content',
            author=self.user1,
            deleted_on=timezone.now()
        )
    
    def test_get_user_post_ids_success(self):
        """Test successfully retrieving post IDs for a user"""
        url = reverse('get-user-post-ids', kwargs={'user_id': self.user1.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('post_ids', response.data)
        self.assertIsInstance(response.data['post_ids'], list)
        self.assertEqual(len(response.data['post_ids']), 2)
        self.assertIn(self.post1.id, response.data['post_ids'])
        self.assertIn(self.post2.id, response.data['post_ids'])
        self.assertNotIn(self.deleted_post.id, response.data['post_ids'])
    
    def test_get_user_post_ids_empty(self):
        """Test retrieving post IDs for a user with no posts"""
        new_user = RegisteredUser.objects.create_user(
            username='newuser',
            email='newuser@test.com',
            password='testpass123'
        )
        url = reverse('get-user-post-ids', kwargs={'user_id': new_user.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('post_ids', response.data)
        self.assertEqual(response.data['post_ids'], [])
    
    def test_get_user_post_ids_user_not_found(self):
        """Test retrieving post IDs for non-existent user"""
        url = reverse('get-user-post-ids', kwargs={'user_id': 99999})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'User not found')
    
    def test_get_user_post_ids_excludes_other_users_posts(self):
        """Test that only the specified user's posts are returned"""
        url = reverse('get-user-post-ids', kwargs={'user_id': self.user1.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.post3.id, response.data['post_ids'])
    
    def test_get_user_post_ids_excludes_soft_deleted(self):
        """Test that soft-deleted posts are not included"""
        url = reverse('get-user-post-ids', kwargs={'user_id': self.user1.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.deleted_post.id, response.data['post_ids'])


class UserIdsEndpointsIntegrationTests(APITestCase):
    """Integration tests for all three endpoints together"""
    
    def setUp(self):
        """Set up test data"""
        self.user = RegisteredUser.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        
        # Create recipes
        self.recipe1 = Recipe.objects.create(
            name='Recipe 1',
            steps=['Step 1'],
            prep_time=5,
            cook_time=10,
            meal_type='lunch',
            creator=self.user
        )
        
        # Create post
        self.post = ForumPost.objects.create(
            title='Test Post',
            content='Test content',
            author=self.user
        )
        
        # Create comment
        self.comment = ForumPostComment.objects.create(
            post=self.post,
            author=self.user,
            content='Test comment'
        )
    
    def test_all_endpoints_return_correct_data(self):
        """Test that all three endpoints return correct data for the same user"""
        # Test recipe IDs
        recipe_url = reverse('get-user-recipe-ids', kwargs={'user_id': self.user.id})
        recipe_response = self.client.get(recipe_url)
        self.assertEqual(recipe_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(recipe_response.data['recipe_ids']), 1)
        self.assertIn(self.recipe1.id, recipe_response.data['recipe_ids'])
        
        # Test comment IDs
        comment_url = reverse('get-user-comment-ids', kwargs={'user_id': self.user.id})
        comment_response = self.client.get(comment_url)
        self.assertEqual(comment_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(comment_response.data['comment_ids']), 1)
        self.assertIn(self.comment.id, comment_response.data['comment_ids'])
        
        # Test post IDs
        post_url = reverse('get-user-post-ids', kwargs={'user_id': self.user.id})
        post_response = self.client.get(post_url)
        self.assertEqual(post_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(post_response.data['post_ids']), 1)
        self.assertIn(self.post.id, post_response.data['post_ids'])


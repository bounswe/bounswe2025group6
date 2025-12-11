"""
Comprehensive Unit and Integration Tests for Activity Stream Endpoint

Tests cover:
- Serializer functionality
- Endpoint integration through API
- All activity types (recipe, post, comment, question, answer)
- Filtering by activity type
- Pagination
- Edge cases (empty streams, soft-deleted content, multiple users)
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.utils import timezone
from datetime import timedelta

from api.models import RegisteredUser
from api.serializers import ActivityStreamSerializer
from recipes.models import Recipe
from forum.models import ForumPost, ForumPostComment
from qa.models import Question, Answer
from decimal import Decimal


class ActivityStreamSerializerUnitTests(TestCase):
    """Unit tests for ActivityStreamSerializer"""

    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_serializer_validates_required_fields(self):
        """Test that serializer requires all required fields"""
        data = {
            'activity_type': 'recipe',
            'activity_id': 1,
            'user_id': self.user.id,
            'user_username': self.user.username,
            'timestamp': timezone.now(),
        }
        serializer = ActivityStreamSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_handles_optional_fields(self):
        """Test that serializer handles optional fields correctly"""
        data = {
            'activity_type': 'recipe',
            'activity_id': 1,
            'user_id': self.user.id,
            'user_username': self.user.username,
            'user_profile_photo': None,
            'timestamp': timezone.now(),
            'title': 'Test Recipe',
            'content': 'Created recipe',
            'target_id': 1,
            'target_title': 'Test Recipe',
            'metadata': {'meal_type': 'lunch'},
        }
        serializer = ActivityStreamSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_validates_data_types(self):
        """Test that serializer validates data types"""
        data = {
            'activity_type': 'recipe',
            'activity_id': 'not_an_int',  # Should be int
            'user_id': self.user.id,
            'user_username': self.user.username,
            'timestamp': timezone.now(),
        }
        serializer = ActivityStreamSerializer(data=data)
        self.assertFalse(serializer.is_valid())


class ActivityStreamIntegrationTests(APITestCase):
    """Integration tests for activity stream endpoint"""

    def setUp(self):
        """Set up test fixtures"""
        self.client = APIClient()
        
        # Create users
        self.user1 = RegisteredUser.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = RegisteredUser.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='testpass123'
        )
        self.user3 = RegisteredUser.objects.create_user(
            username='user3',
            email='user3@example.com',
            password='testpass123'
        )
        
        # Authenticate user1
        token, _ = Token.objects.get_or_create(user=self.user1)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)
        
        # user1 follows user2 and user3
        self.user1.followedUsers.add(self.user2, self.user3)

    def test_activity_stream_empty_when_not_following_anyone(self):
        """Test that activity stream is empty when user follows no one"""
        # Create a new user who doesn't follow anyone
        user4 = RegisteredUser.objects.create_user(
            username='user4',
            email='user4@example.com',
            password='testpass123'
        )
        token, _ = Token.objects.get_or_create(user=user4)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)
        
        # Create activities by other users
        Recipe.objects.create(
            name='Some Recipe',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 0)
        self.assertEqual(len(response.data['results']), 0)

    def test_activity_stream_includes_recipe_activities(self):
        """Test that recipe creations appear in activity stream"""
        recipe = Recipe.objects.create(
            name='Test Recipe',
            steps=['Step 1', 'Step 2'],
            prep_time=15,
            cook_time=20,
            meal_type='dinner',
            creator=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['total'], 1)
        
        recipe_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'recipe' and activity['activity_id'] == recipe.id:
                recipe_activity = activity
                break
        
        self.assertIsNotNone(recipe_activity)
        self.assertEqual(recipe_activity['user_id'], self.user2.id)
        self.assertEqual(recipe_activity['user_username'], self.user2.username)
        self.assertEqual(recipe_activity['title'], 'Test Recipe')
        self.assertEqual(recipe_activity['activity_type'], 'recipe')
        self.assertIn('metadata', recipe_activity)
        self.assertEqual(recipe_activity['metadata']['meal_type'], 'dinner')

    def test_activity_stream_includes_forum_post_activities(self):
        """Test that forum post creations appear in activity stream"""
        post = ForumPost.objects.create(
            title='Test Post',
            content='This is a test forum post',
            author=self.user2,
            tags=['tips', 'meal-prep']
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        post_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'post' and activity['activity_id'] == post.id:
                post_activity = activity
                break
        
        self.assertIsNotNone(post_activity)
        self.assertEqual(post_activity['user_id'], self.user2.id)
        self.assertEqual(post_activity['user_username'], self.user2.username)
        self.assertEqual(post_activity['title'], 'Test Post')
        self.assertIn('tags', post_activity['metadata'])

    def test_activity_stream_includes_comment_activities(self):
        """Test that forum post comments appear in activity stream"""
        post = ForumPost.objects.create(
            title='Test Post',
            content='This is a test post',
            author=self.user1  # Post by user1, but comment by followed user
        )
        
        comment = ForumPostComment.objects.create(
            post=post,
            content='This is a test comment',
            author=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        comment_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'comment' and activity['activity_id'] == comment.id:
                comment_activity = activity
                break
        
        self.assertIsNotNone(comment_activity)
        self.assertEqual(comment_activity['user_id'], self.user2.id)
        self.assertEqual(comment_activity['target_id'], post.id)
        self.assertEqual(comment_activity['target_title'], post.title)

    def test_activity_stream_includes_question_activities(self):
        """Test that question creations appear in activity stream"""
        question = Question.objects.create(
            title='Test Question',
            content='This is a test question',
            author=self.user3,
            tags=['nutrition', 'health']
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        question_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'question' and activity['activity_id'] == question.id:
                question_activity = activity
                break
        
        self.assertIsNotNone(question_activity)
        self.assertEqual(question_activity['user_id'], self.user3.id)
        self.assertEqual(question_activity['title'], 'Test Question')

    def test_activity_stream_includes_answer_activities(self):
        """Test that answer creations appear in activity stream"""
        question = Question.objects.create(
            title='Test Question',
            content='This is a question',
            author=self.user1
        )
        
        answer = Answer.objects.create(
            post=question,
            content='This is an answer',
            author=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        answer_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'answer' and activity['activity_id'] == answer.id:
                answer_activity = activity
                break
        
        self.assertIsNotNone(answer_activity)
        self.assertEqual(answer_activity['user_id'], self.user2.id)
        self.assertEqual(answer_activity['target_id'], question.id)

    def test_activity_stream_filters_by_activity_type_recipe(self):
        """Test filtering activity stream by recipe type"""
        # Create different activity types
        Recipe.objects.create(
            name='Recipe 1',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        
        ForumPost.objects.create(
            title='Post 1',
            content='Content',
            author=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url, {'activity_type': 'recipe'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # All results should be recipes
        for activity in response.data['results']:
            self.assertEqual(activity['activity_type'], 'recipe')

    def test_activity_stream_filters_by_activity_type_post(self):
        """Test filtering activity stream by post type"""
        Recipe.objects.create(
            name='Recipe 1',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        
        ForumPost.objects.create(
            title='Post 1',
            content='Content',
            author=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url, {'activity_type': 'post'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        for activity in response.data['results']:
            self.assertEqual(activity['activity_type'], 'post')

    def test_activity_stream_filters_by_activity_type_comment(self):
        """Test filtering activity stream by comment type"""
        post = ForumPost.objects.create(
            title='Test Post',
            content='Content',
            author=self.user1
        )
        
        ForumPostComment.objects.create(
            post=post,
            content='Comment content',
            author=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url, {'activity_type': 'comment'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        for activity in response.data['results']:
            self.assertEqual(activity['activity_type'], 'comment')

    def test_activity_stream_filters_by_activity_type_question(self):
        """Test filtering activity stream by question type"""
        Question.objects.create(
            title='Question 1',
            content='Content',
            author=self.user2
        )
        
        Recipe.objects.create(
            name='Recipe 1',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url, {'activity_type': 'question'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        for activity in response.data['results']:
            self.assertEqual(activity['activity_type'], 'question')

    def test_activity_stream_filters_by_activity_type_answer(self):
        """Test filtering activity stream by answer type"""
        question = Question.objects.create(
            title='Question 1',
            content='Content',
            author=self.user1
        )
        
        Answer.objects.create(
            post=question,
            content='Answer content',
            author=self.user2
        )
        
        Recipe.objects.create(
            name='Recipe 1',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url, {'activity_type': 'answer'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        for activity in response.data['results']:
            self.assertEqual(activity['activity_type'], 'answer')

    def test_activity_stream_pagination(self):
        """Test that activity stream supports pagination"""
        # Create multiple activities
        for i in range(25):
            Recipe.objects.create(
                name=f'Recipe {i}',
                steps=['Step 1'],
                prep_time=10,
                cook_time=10,
                meal_type='lunch',
                creator=self.user2
            )
        
        url = reverse('activity-stream')
        response = self.client.get(url, {'page_size': 10})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['page_size'], 10)
        self.assertEqual(len(response.data['results']), 10)
        self.assertGreaterEqual(response.data['total'], 25)

    def test_activity_stream_pagination_page_2(self):
        """Test accessing second page of activity stream"""
        # Create multiple activities
        for i in range(15):
            Recipe.objects.create(
                name=f'Recipe {i}',
                steps=['Step 1'],
                prep_time=10,
                cook_time=10,
                meal_type='lunch',
                creator=self.user2
            )
        
        url = reverse('activity-stream')
        response = self.client.get(url, {'page': 2, 'page_size': 10})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['page'], 2)
        self.assertLessEqual(len(response.data['results']), 10)

    def test_activity_stream_sorted_by_timestamp_descending(self):
        """Test that activities are sorted by timestamp (most recent first)"""
        # Create activities with different timestamps
        old_time = timezone.now() - timedelta(days=2)
        new_time = timezone.now() - timedelta(hours=1)
        
        recipe1 = Recipe.objects.create(
            name='Old Recipe',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        recipe1.created_at = old_time
        recipe1.save()
        
        recipe2 = Recipe.objects.create(
            name='New Recipe',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        recipe2.created_at = new_time
        recipe2.save()
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 2)
        
        # Most recent should be first
        timestamps = [activity['timestamp'] for activity in response.data['results'][:2]]
        self.assertTrue(timestamps[0] >= timestamps[1])

    def test_activity_stream_excludes_soft_deleted_recipes(self):
        """Test that soft-deleted recipes don't appear in activity stream"""
        recipe = Recipe.objects.create(
            name='Deleted Recipe',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        
        # Soft delete the recipe
        recipe.deleted_on = timezone.now()
        recipe.save()
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Recipe should not appear in results
        recipe_ids = [activity['activity_id'] for activity in response.data['results'] 
                     if activity['activity_type'] == 'recipe']
        self.assertNotIn(recipe.id, recipe_ids)

    def test_activity_stream_excludes_soft_deleted_posts(self):
        """Test that soft-deleted posts don't appear in activity stream"""
        post = ForumPost.objects.create(
            title='Deleted Post',
            content='Content',
            author=self.user2
        )
        
        # Soft delete the post
        post.deleted_on = timezone.now()
        post.save()
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        post_ids = [activity['activity_id'] for activity in response.data['results'] 
                   if activity['activity_type'] == 'post']
        self.assertNotIn(post.id, post_ids)

    def test_activity_stream_excludes_soft_deleted_comments(self):
        """Test that soft-deleted comments don't appear in activity stream"""
        post = ForumPost.objects.create(
            title='Test Post',
            content='Content',
            author=self.user1
        )
        
        comment = ForumPostComment.objects.create(
            post=post,
            content='Deleted Comment',
            author=self.user2
        )
        
        # Soft delete the comment
        comment.deleted_on = timezone.now()
        comment.save()
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        comment_ids = [activity['activity_id'] for activity in response.data['results'] 
                      if activity['activity_type'] == 'comment']
        self.assertNotIn(comment.id, comment_ids)

    def test_activity_stream_excludes_soft_deleted_questions(self):
        """Test that soft-deleted questions don't appear in activity stream"""
        question = Question.objects.create(
            title='Deleted Question',
            content='Content',
            author=self.user2
        )
        
        # Soft delete the question
        question.deleted_on = timezone.now()
        question.save()
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        question_ids = [activity['activity_id'] for activity in response.data['results'] 
                       if activity['activity_type'] == 'question']
        self.assertNotIn(question.id, question_ids)

    def test_activity_stream_excludes_soft_deleted_answers(self):
        """Test that soft-deleted answers don't appear in activity stream"""
        question = Question.objects.create(
            title='Test Question',
            content='Content',
            author=self.user1
        )
        
        answer = Answer.objects.create(
            post=question,
            content='Deleted Answer',
            author=self.user2
        )
        
        # Soft delete the answer
        answer.deleted_on = timezone.now()
        answer.save()
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        answer_ids = [activity['activity_id'] for activity in response.data['results'] 
                     if activity['activity_type'] == 'answer']
        self.assertNotIn(answer.id, answer_ids)

    def test_activity_stream_includes_multiple_followed_users(self):
        """Test that activities from multiple followed users appear"""
        Recipe.objects.create(
            name='Recipe from user2',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        
        ForumPost.objects.create(
            title='Post from user3',
            content='Content',
            author=self.user3
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        user_ids = [activity['user_id'] for activity in response.data['results']]
        self.assertIn(self.user2.id, user_ids)
        self.assertIn(self.user3.id, user_ids)

    def test_activity_stream_excludes_own_activities(self):
        """Test that user's own activities don't appear (only followed users)"""
        Recipe.objects.create(
            name='My Recipe',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user1  # Created by user1 (the authenticated user)
        )
        
        Recipe.objects.create(
            name='Followed User Recipe',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2  # Created by followed user
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only contain activities from followed users
        for activity in response.data['results']:
            self.assertNotEqual(activity['user_id'], self.user1.id)

    def test_activity_stream_excludes_unfollowed_user_activities(self):
        """Test that activities from unfollowed users don't appear"""
        user4 = RegisteredUser.objects.create_user(
            username='user4',
            email='user4@example.com',
            password='testpass123'
        )
        
        Recipe.objects.create(
            name='Unfollowed User Recipe',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=user4  # Created by unfollowed user
        )
        
        Recipe.objects.create(
            name='Followed User Recipe',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2  # Created by followed user
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        user_ids = [activity['user_id'] for activity in response.data['results']]
        self.assertNotIn(user4.id, user_ids)
        self.assertIn(self.user2.id, user_ids)

    def test_activity_stream_requires_authentication(self):
        """Test that activity stream endpoint requires authentication"""
        self.client.credentials()  # Remove authentication
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_activity_stream_includes_user_profile_photo(self):
        """Test that user profile photos are included when available"""
        # Create a recipe by followed user (profile photo may or may not be set)
        recipe = Recipe.objects.create(
            name='Test Recipe',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        recipe_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'recipe' and activity['activity_id'] == recipe.id:
                recipe_activity = activity
                break
        
        self.assertIsNotNone(recipe_activity)
        # Profile photo should be included (even if None)
        self.assertIn('user_profile_photo', recipe_activity)

    def test_activity_stream_content_truncation(self):
        """Test that long content is truncated in activity stream"""
        long_content = 'A' * 500  # Very long content
        
        post = ForumPost.objects.create(
            title='Test Post',
            content=long_content,
            author=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        post_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'post' and activity['activity_id'] == post.id:
                post_activity = activity
                break
        
        self.assertIsNotNone(post_activity)
        # Content should be truncated to 200 characters
        self.assertLessEqual(len(post_activity['content']), 200)

    def test_activity_stream_metadata_for_recipes(self):
        """Test that recipe activities include proper metadata"""
        recipe = Recipe.objects.create(
            name='Test Recipe',
            steps=['Step 1'],
            prep_time=15,
            cook_time=30,
            meal_type='dinner',
            creator=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        recipe_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'recipe' and activity['activity_id'] == recipe.id:
                recipe_activity = activity
                break
        
        self.assertIsNotNone(recipe_activity)
        self.assertIn('metadata', recipe_activity)
        self.assertEqual(recipe_activity['metadata']['meal_type'], 'dinner')
        self.assertEqual(recipe_activity['metadata']['prep_time'], 15)
        self.assertEqual(recipe_activity['metadata']['cook_time'], 30)

    def test_activity_stream_metadata_for_posts(self):
        """Test that post activities include proper metadata"""
        post = ForumPost.objects.create(
            title='Test Post',
            content='Content',
            author=self.user2,
            tags=['tips', 'meal-prep'],
            upvote_count=10,
            downvote_count=2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        post_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'post' and activity['activity_id'] == post.id:
                post_activity = activity
                break
        
        self.assertIsNotNone(post_activity)
        self.assertIn('metadata', post_activity)
        self.assertIn('tags', post_activity['metadata'])
        self.assertEqual(post_activity['metadata']['upvote_count'], 10)

    def test_activity_stream_metadata_for_comments(self):
        """Test that comment activities include proper metadata"""
        post = ForumPost.objects.create(
            title='Test Post',
            content='Content',
            author=self.user1
        )
        
        comment = ForumPostComment.objects.create(
            post=post,
            content='Comment',
            author=self.user2,
            level=0,
            upvote_count=5
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        comment_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'comment' and activity['activity_id'] == comment.id:
                comment_activity = activity
                break
        
        self.assertIsNotNone(comment_activity)
        self.assertIn('metadata', comment_activity)
        self.assertEqual(comment_activity['metadata']['post_id'], post.id)
        self.assertEqual(comment_activity['metadata']['level'], 0)

    def test_activity_stream_handles_mixed_activity_types(self):
        """Test activity stream with multiple different activity types"""
        Recipe.objects.create(
            name='Recipe 1',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        
        ForumPost.objects.create(
            title='Post 1',
            content='Content',
            author=self.user2
        )
        
        Question.objects.create(
            title='Question 1',
            content='Content',
            author=self.user3
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        activity_types = [activity['activity_type'] for activity in response.data['results']]
        self.assertIn('recipe', activity_types)
        self.assertIn('post', activity_types)
        self.assertIn('question', activity_types)

    def test_activity_stream_pagination_max_page_size(self):
        """Test that pagination respects max page size limit"""
        # Create activities
        for i in range(50):
            Recipe.objects.create(
                name=f'Recipe {i}',
                steps=['Step 1'],
                prep_time=10,
                cook_time=10,
                meal_type='lunch',
                creator=self.user2
            )
        
        url = reverse('activity-stream')
        # Request more than max page size (100)
        response = self.client.get(url, {'page_size': 200})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should be limited to max page size
        self.assertLessEqual(response.data['page_size'], 100)

    def test_activity_stream_unfollow_user_stops_showing_activities(self):
        """Test that unfollowing a user stops showing their activities"""
        recipe = Recipe.objects.create(
            name='Recipe Before Unfollow',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        # Should see the recipe
        recipe_ids = [a['activity_id'] for a in response.data['results'] 
                     if a['activity_type'] == 'recipe']
        self.assertIn(recipe.id, recipe_ids)
        
        # Unfollow user2
        self.user1.followedUsers.remove(self.user2)
        
        # Should not see the recipe anymore
        response = self.client.get(url)
        recipe_ids = [a['activity_id'] for a in response.data['results'] 
                     if a['activity_type'] == 'recipe']
        self.assertNotIn(recipe.id, recipe_ids)

    def test_activity_stream_follow_user_starts_showing_activities(self):
        """Test that following a user starts showing their activities"""
        user4 = RegisteredUser.objects.create_user(
            username='user4',
            email='user4@example.com',
            password='testpass123'
        )
        
        recipe = Recipe.objects.create(
            name='Recipe Before Follow',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=user4
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        # Should not see the recipe yet
        recipe_ids = [a['activity_id'] for a in response.data['results'] 
                     if a['activity_type'] == 'recipe']
        self.assertNotIn(recipe.id, recipe_ids)
        
        # Follow user4
        self.user1.followedUsers.add(user4)
        
        # Should see the recipe now
        response = self.client.get(url)
        recipe_ids = [a['activity_id'] for a in response.data['results'] 
                     if a['activity_type'] == 'recipe']
        self.assertIn(recipe.id, recipe_ids)

    def test_activity_stream_timestamp_format(self):
        """Test that timestamps are properly formatted"""
        recipe = Recipe.objects.create(
            name='Test Recipe',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        recipe_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'recipe' and activity['activity_id'] == recipe.id:
                recipe_activity = activity
                break
        
        self.assertIsNotNone(recipe_activity)
        # Timestamp should be a valid datetime string
        self.assertIn('timestamp', recipe_activity)
        self.assertIsNotNone(recipe_activity['timestamp'])

    def test_activity_stream_comment_target_references(self):
        """Test that comment activities correctly reference their target post"""
        post = ForumPost.objects.create(
            title='Original Post',
            content='Post content',
            author=self.user1
        )
        
        comment = ForumPostComment.objects.create(
            post=post,
            content='Comment content',
            author=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        comment_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'comment' and activity['activity_id'] == comment.id:
                comment_activity = activity
                break
        
        self.assertIsNotNone(comment_activity)
        self.assertEqual(comment_activity['target_id'], post.id)
        self.assertEqual(comment_activity['target_title'], post.title)

    def test_activity_stream_answer_target_references(self):
        """Test that answer activities correctly reference their target question"""
        question = Question.objects.create(
            title='Original Question',
            content='Question content',
            author=self.user1
        )
        
        answer = Answer.objects.create(
            post=question,
            content='Answer content',
            author=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        answer_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'answer' and activity['activity_id'] == answer.id:
                answer_activity = activity
                break
        
        self.assertIsNotNone(answer_activity)
        self.assertEqual(answer_activity['target_id'], question.id)
        self.assertEqual(answer_activity['target_title'], question.title)

    def test_activity_stream_invalid_activity_type_filter(self):
        """Test that invalid activity type filter still works (returns empty or all)"""
        Recipe.objects.create(
            name='Test Recipe',
            steps=['Step 1'],
            prep_time=10,
            cook_time=10,
            meal_type='lunch',
            creator=self.user2
        )
        
        url = reverse('activity-stream')
        # Invalid activity type
        response = self.client.get(url, {'activity_type': 'invalid_type'})
        
        # Should still return 200, but may return empty results or all results
        # depending on implementation
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_activity_stream_empty_content_fields(self):
        """Test that activities with empty content are handled correctly"""
        post = ForumPost.objects.create(
            title='Empty Content Post',
            content='',
            author=self.user2
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        post_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'post' and activity['activity_id'] == post.id:
                post_activity = activity
                break
        
        self.assertIsNotNone(post_activity)
        # Content should be empty string, not None
        self.assertEqual(post_activity['content'], '')

    def test_activity_stream_nested_comment_levels(self):
        """Test that nested comments include correct level in metadata"""
        post = ForumPost.objects.create(
            title='Test Post',
            content='Content',
            author=self.user1
        )
        
        parent_comment = ForumPostComment.objects.create(
            post=post,
            content='Parent comment',
            author=self.user2,
            level=0
        )
        
        child_comment = ForumPostComment.objects.create(
            post=post,
            content='Child comment',
            author=self.user2,
            parent_comment=parent_comment,
            level=1
        )
        
        url = reverse('activity-stream')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        child_activity = None
        for activity in response.data['results']:
            if activity['activity_type'] == 'comment' and activity['activity_id'] == child_comment.id:
                child_activity = activity
                break
        
        self.assertIsNotNone(child_activity)
        self.assertEqual(child_activity['metadata']['level'], 1)


from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from forum.models import ForumPost, ForumPostComment


class ForumPostCommentAPITestCase(APITestCase):

    def setUp(self):
        self.client = APIClient()

        # Create user and authenticate
        self.user = get_user_model().objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword'
        )
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # Create a post
        self.post = ForumPost.objects.create(
            title='Test Post',
            content='This is a test post',
            author=self.user
        )

        self.base_url = f'/forum/posts/{self.post.id}/comments/'

    def test_create_comment(self):
        data = {
            'content': 'This is a test comment',
        }
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], data['content'])

    def test_list_comments(self):
        comment = ForumPostComment.objects.create(
            post=self.post,
            author=self.user,
            content='Another comment'
        )
        response = self.client.get(self.base_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertTrue(any(c['content'] == comment.content for c in response.data['results']))

    def test_delete_comment(self):
        comment = ForumPostComment.objects.create(
            post=self.post,
            author=self.user,
            content='To be deleted'
        )
        url = f"{self.base_url}{comment.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify soft delete (deleted_on is set)
        comment.refresh_from_db()
        self.assertIsNotNone(comment.deleted_on)

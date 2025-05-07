# forum/tests/post_endpoint_tests/test_post_endpoints.py
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from forum.models import ForumPost, ForumPostComment

class ForumPostCommentAPITestCase(APITestCase):

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='testuser',
            password='testpassword'
        )
        self.forum_post = ForumPost.objects.create(
            author=self.user,
            title='Test Post',
            content='This is a test post for comments.',
            is_commentable=True
        )
        self.url = f'/api/forum/posts/{self.forum_post.id}/comments/'
        self.client.login(username='testuser', password='testpassword')

    def test_create_comment(self):
        data = {'content': 'This is a comment on the forum post.'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], data['content'])
        self.assertEqual(response.data['author'], self.user.username)
        self.assertEqual(response.data['post'], self.forum_post.id)

    def test_list_comments(self):
        comment = ForumPostComment.objects.create(
            author=self.user,
            content='This is a test comment',
            post=self.forum_post
        )
        response = self.client.get(self.url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['content'], comment.content)

    def test_delete_comment(self):
        comment = ForumPostComment.objects.create(
            author=self.user,
            content='This comment will be deleted',
            post=self.forum_post
        )
        comment_url = f'{self.url}{comment.id}/'
        response = self.client.delete(comment_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ForumPostComment.objects.count(), 0)

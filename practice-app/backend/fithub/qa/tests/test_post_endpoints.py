from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import RegisteredUser
from qa.models import Answer, Question


class QuestionAnswerAPITestCase(APITestCase):

    def setUp(self):
        self.client = APIClient()

        self.user = get_user_model().objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword',
            usertype=RegisteredUser.DIETITIAN
        )
        self.user.save()
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        self.post = Question.objects.create(
            title='Test Question',
            content='This is a test question',
            author=self.user
        )

        self.base_url = f'/qa/questions/{self.post.id}/answers/'

    def test_create_comment(self):
        data = {
            'content': 'This is a test answer',
        }
        response = self.client.post(self.base_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], data['content'])

    def test_list_comments(self):
        comment = Answer.objects.create(post=self.post, author=self.user, content='Another answer')
        response = self.client.get(self.base_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertTrue(any(c['content'] == comment.content for c in response.data['results']))

    def test_delete_comment(self):
        comment = Answer.objects.create(post=self.post, author=self.user, content='To be deleted')
        url = f"{self.base_url}{comment.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        comment.refresh_from_db()
        self.assertIsNotNone(comment.deleted_on)

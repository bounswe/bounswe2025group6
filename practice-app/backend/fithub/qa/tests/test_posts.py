# qa/tests/test_posts.py
from django.test import TestCase
from api.models import RegisteredUser
from qa.models import Question, Answer


class QuestionModelTest(TestCase):
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword'
        )

        self.question = Question.objects.create(
            author=self.user,
            title="Test Question",
            content="This is a test content for the question."
        )

        self.question.tags = ["Budget", "Vegan"]
        self.question.save()

    def test_question_creation(self):
        question = self.question
        self.assertEqual(question.title, "Test Question")
        self.assertEqual(question.content, "This is a test content for the question.")
        self.assertEqual(question.author, self.user)
        self.assertTrue(question.is_commentable)
        self.assertEqual(question.view_count, 0)
        self.assertEqual(question.upvote_count, 0)
        self.assertEqual(question.downvote_count, 0)

    def test_question_tags(self):
        question = self.question
        self.assertIn("Budget", question.tags)
        self.assertIn("Vegan", question.tags)

    def test_question_field_defaults(self):
        question = self.question
        self.assertTrue(question.is_commentable)
        self.assertEqual(question.view_count, 0)
        self.assertEqual(question.upvote_count, 0)
        self.assertEqual(question.downvote_count, 0)

    def test_question_str_method(self):
        question = self.question
        self.assertEqual(str(question), f"Question #{question.pk}, {question.title}")

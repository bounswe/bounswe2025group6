from django.test import TestCase
from api.models import RegisteredUser
from qa.models import Answer, Question


class AnswerTestCase(TestCase):
    def setUp(self):
        self.user = RegisteredUser.objects.create_user(
            username='commenter',
            email='commenter@example.com',
            password='commentpassword',
            usertype=RegisteredUser.DIETITIAN
        )
        self.question = Question.objects.create(
            author=self.user,
            title="Test Question for Answers",
            content="Content for testing answer functionality."
        )

    def test_create_comment(self):
        comment = Answer.objects.create(
            author=self.user,
            content="This is an answer on the question.",
            post=self.question
        )
        self.assertEqual(comment.content, "This is an answer on the question.")
        self.assertEqual(comment.author, self.user)
        self.assertEqual(comment.post, self.question)
        self.assertEqual(comment.upvote_count, 0)
        self.assertEqual(comment.downvote_count, 0)

    def test_inc_upvote_comment(self):
        comment = Answer.objects.create(
            author=self.user,
            content="This is an answer on the question.",
            post=self.question
        )
        comment.increment_upvote()
        self.assertEqual(comment.upvote_count, 1)

    def test_inc_downvote_comment(self):
        comment = Answer.objects.create(
            author=self.user,
            content="This is an answer on the question.",
            post=self.question
        )
        comment.increment_downvote()
        self.assertEqual(comment.downvote_count, 1)

    def test_reply_to_comment(self):
        comment = Answer.objects.create(
            author=self.user,
            content="This is an answer on the question.",
            post=self.question
        )
        reply = Answer.objects.create(
            author=self.user,
            content="This is a reply to the comment.",
            post=self.question,
            parent_comment=comment
        )
        self.assertEqual(reply.parent_comment, comment)
        self.assertEqual(comment.replies.count(), 1)

    def test_comment_on_non_commentable_post(self):
        non_commentable_post = Question.objects.create(
            author=self.user,
            title="Non Answerable Question",
            content="This question cannot have answers.",
            is_commentable=False
        )
        with self.assertRaises(ValueError):
            Answer.objects.create(
                author=self.user,
                content="This answer should not work.",
                post=non_commentable_post
            )

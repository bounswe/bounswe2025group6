from django.test import TestCase
from api.models import RegisteredUser
from forum.models import ForumPost, ForumPostComment

# ForumPostComment Model Tests
class ForumPostCommentTestCase(TestCase):
    def setUp(self):
        # Set up users and posts for comment testing
        self.user = RegisteredUser.objects.create_user(
            username='commenter',
            email='commenter@example.com',
            password='commentpassword'
        )
        self.forum_post = ForumPost.objects.create(
            author=self.user,
            title="Test Post for Comments",
            content="Content for testing comment functionality."
        )

    def test_create_comment(self):
        """Test that a comment can be created and is linked to a ForumPost"""
        comment = ForumPostComment.objects.create(
            author=self.user,
            content="This is a comment on the forum post.",
            post=self.forum_post
        )
        self.assertEqual(comment.content, "This is a comment on the forum post.")
        self.assertEqual(comment.author, self.user)
        self.assertEqual(comment.post, self.forum_post)
        self.assertEqual(comment.upvote_count, 0)
        self.assertEqual(comment.downvote_count, 0)

    def test_inc_upvote_comment(self):
        """Test the upvote functionality of a comment"""
        comment = ForumPostComment.objects.create(
            author=self.user,
            content="This is a comment on the forum post.",
            post=self.forum_post
        )
        comment.increment_upvote()
        self.assertEqual(comment.upvote_count, 1)

    def test_inc_downvote_comment(self):
        """Test the downvote functionality of a comment"""
        comment = ForumPostComment.objects.create(
            author=self.user,
            content="This is a comment on the forum post.",
            post=self.forum_post
        )
        comment.increment_downvote()
        self.assertEqual(comment.downvote_count, 1)

    def test_reply_to_comment(self):
        """Test creating a reply to an existing comment"""
        comment = ForumPostComment.objects.create(
            author=self.user,
            content="This is a comment on the forum post.",
            post=self.forum_post
        )
        reply = ForumPostComment.objects.create(
            author=self.user,
            content="This is a reply to the comment.",
            post=self.forum_post,
            parent_comment=comment
        )
        self.assertEqual(reply.parent_comment, comment)
        self.assertEqual(comment.replies.count(), 1)

    def test_comment_on_non_commentable_post(self):
        """Test that no comment can be created on a non-commentable post"""
        non_commentable_post = ForumPost.objects.create(
            author=self.user,
            title="Non Commentable Post",
            content="This post cannot have comments.",
            is_commentable=False
        )
        with self.assertRaises(ValueError):
            ForumPostComment.objects.create(
                author=self.user,
                content="This comment should not work.",
                post=non_commentable_post
            )

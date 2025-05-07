# forum/tests.py
from django.test import TestCase
from api.models import RegisteredUser
from forum.models import ForumPost
from utils.models import Tag

# ForumPost Model Tests
class ForumPostModelTest(TestCase):
    def setUp(self):
        # Create a test RegisteredUser (author)
        self.user = RegisteredUser.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword'
        )

        # Create some tags
        self.tag1 = Tag.objects.create(name='Budget')
        self.tag2 = Tag.objects.create(name='Vegan')

        # Create a forum post
        self.forum_post = ForumPost.objects.create(
            author=self.user,
            title="Test Forum Post",
            content="This is a test content for the forum post."
        )

        # Add tags to the forum post
        self.forum_post.tags.add(self.tag1, self.tag2)

    def test_forum_post_creation(self):
        # Test that the ForumPost was created successfully
        forum_post = self.forum_post
        self.assertEqual(forum_post.title, "Test Forum Post")
        self.assertEqual(forum_post.content, "This is a test content for the forum post.")
        self.assertEqual(forum_post.author, self.user)
        self.assertTrue(forum_post.is_commentable)  # By default is_commentable is True
        self.assertEqual(forum_post.view_count, 0)  # Default view_count
        self.assertEqual(forum_post.like_count, 0)  # Default like_count

    def test_forum_post_tags(self):
        # Ensure that tags are added correctly to the ForumPost
        forum_post = self.forum_post
        self.assertIn(self.tag1, forum_post.tags.all())
        self.assertIn(self.tag2, forum_post.tags.all())

    def test_forum_post_field_defaults(self):
        # Test that default fields are set correctly
        forum_post = self.forum_post
        self.assertTrue(forum_post.is_commentable)
        self.assertEqual(forum_post.view_count, 0)
        self.assertEqual(forum_post.like_count, 0)

    def test_forum_post_str_method(self):
        # Check that the string representation is correct
        forum_post = self.forum_post
        self.assertEqual(str(forum_post), f"ForumPost #{forum_post.pk}, {forum_post.title}")



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
        self.assertEqual(comment.reported_count, 0)

    def test_upvote_comment(self):
        """Test the upvote functionality of a comment"""
        comment = ForumPostComment.objects.create(
            author=self.user,
            content="This is a comment on the forum post.",
            post=self.forum_post
        )
        comment.upvote()
        self.assertEqual(comment.upvote_count, 1)

    def test_downvote_comment(self):
        """Test the downvote functionality of a comment"""
        comment = ForumPostComment.objects.create(
            author=self.user,
            content="This is a comment on the forum post.",
            post=self.forum_post
        )
        comment.downvote()
        self.assertEqual(comment.downvote_count, 1)

    def test_report_comment(self):
        """Test reporting a comment"""
        comment = ForumPostComment.objects.create(
            author=self.user,
            content="This is a comment on the forum post.",
            post=self.forum_post
        )
        comment.report()
        self.assertEqual(comment.reported_count, 1)

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
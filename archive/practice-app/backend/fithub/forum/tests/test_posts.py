# forum/tests/post_tests/test_posts.py
from django.test import TestCase
from api.models import RegisteredUser
from forum.models import ForumPost, ForumPostComment

class ForumPostModelTest(TestCase):
    def setUp(self):
        # Create a test RegisteredUser (author)
        self.user = RegisteredUser.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword'
        )

        # Create a forum post
        self.forum_post = ForumPost.objects.create(
            author=self.user,
            title="Test Forum Post",
            content="This is a test content for the forum post."
        )

        # Add tags directly to the forum post (using JSONField)
        self.forum_post.tags = ["Budget", "Vegan"]
        self.forum_post.save()

    def test_forum_post_creation(self):
        """Test the creation of a ForumPost"""
        forum_post = self.forum_post
        self.assertEqual(forum_post.title, "Test Forum Post")
        self.assertEqual(forum_post.content, "This is a test content for the forum post.")
        self.assertEqual(forum_post.author, self.user)
        self.assertTrue(forum_post.is_commentable)  # By default is_commentable is True
        self.assertEqual(forum_post.view_count, 0)  # Default view_count
        self.assertEqual(forum_post.upvote_count, 0)  # Default upvote_count
        self.assertEqual(forum_post.downvote_count, 0)

    def test_forum_post_tags(self):
        """Ensure tags are added correctly to the ForumPost"""
        forum_post = self.forum_post
        self.assertIn("Budget", forum_post.tags)
        self.assertIn("Vegan", forum_post.tags)

    def test_forum_post_field_defaults(self):
        """Test that default fields are set correctly"""
        forum_post = self.forum_post
        self.assertTrue(forum_post.is_commentable)
        self.assertEqual(forum_post.view_count, 0)
        self.assertEqual(forum_post.upvote_count, 0)
        self.assertEqual(forum_post.downvote_count, 0)

    def test_forum_post_str_method(self):
        """Check that the string representation is correct"""
        forum_post = self.forum_post
        self.assertEqual(str(forum_post), f"ForumPost #{forum_post.pk}, {forum_post.title}")

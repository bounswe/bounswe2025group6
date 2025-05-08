# forum/models.py
from django.db import models
from utils.models import PostModel, CommentModel, CommentVote
from api.models import TimestampedModel
from django.utils.timezone import now

class ForumPost(PostModel):
    # The Post model already has all the necessary fields for a forum post
    # If you need to add any specific fields for ForumPost, you can do so here

    # Define choices for tags inside the ForumPost model
    class TagChoices(models.TextChoices):
        BUDGET = 'Budget'
        MEAL_PREP = 'Meal Prep'
        FAMILY = 'Family'
        NO_WASTE = 'No Waste'
        SUSTAINABILITY = 'Sustainability'
        TIPS = 'Tips'
        GLUTEN_FREE = 'Gluten Free'
        VEGAN = 'Vegan'
        VEGETARIAN = 'Vegetarian'
        QUICK = 'Quick'
        HEALTHY = 'Healthy'
        STUDENT = 'Student'
        NUTRITION = 'Nutrition'
        HEALTHY_EATING = 'Healthy Eating'
        SNACKS = 'Snacks'

    # Store tags as a list of strings
    tags = models.JSONField(default=list, blank=True)  # Django 3.1+ supports JSONField

    def delete_comments(self):
        """
        Soft delete all comments related to this post.
        """
        comments = self.comments.filter(deleted_on__isnull=True)
        comments.update(deleted_on=now())

    def __str__(self):
        return f"ForumPost #{self.pk}, {self.title}"


class ForumPostComment(CommentModel):
    post = models.ForeignKey('ForumPost', related_name='comments', on_delete=models.CASCADE)

    def __str__(self):
        return f"Comment by {self.author} on Post {self.post.id}"

    def get_replies(self):
        """Get all replies (children) to this comment."""
        return self.replies.all()

class ForumPostCommentVote(CommentVote):
    comment = models.ForeignKey(ForumPostComment, related_name='votes', on_delete=models.CASCADE)
    """Model for voting on comments in forum posts. Extends CommentVote."""
    pass

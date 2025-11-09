# forum/models.py
from django.db import models
from utils.models import PostModel, PostVoteModel, CommentModel, CommentVoteModel
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
    tags = models.JSONField(default=list, blank=True)  

    def delete(self, using=None, keep_parents=False):
        """
        Soft delete this post and cascade to its related comments (and optionally votes).
        """
        # Soft delete the post itself
        self.deleted_on = now()
        self.save(update_fields=["deleted_on"])

        # Soft delete related comments
        comments = self.comments.filter(deleted_on__isnull=True)
        for comment in comments:
            comment.deleted_on = now()
            comment.save(update_fields=["deleted_on"])

            # Optional: also soft delete votes for each comment
            comment.votes.filter(deleted_on__isnull=True).update(deleted_on=now())

        # Soft delete all post votes
        self.votes.filter(deleted_on__isnull=True).update(deleted_on=now())
        
    def __str__(self):
        return f"ForumPost #{self.pk}, {self.title}"

class ForumPostVote(PostVoteModel):
    post = models.ForeignKey(ForumPost, related_name='votes', on_delete=models.CASCADE)
    """Model for voting on forum posts. Extends PostVote."""
    pass


### MODELS FOR COMMENTS ###

class ForumPostComment(CommentModel):
    post = models.ForeignKey('ForumPost', related_name='comments', on_delete=models.CASCADE)

    def __str__(self):
        return f"Comment by {self.author} on Post {self.post.id}"

    def get_replies(self):
        """Get all replies (children) to this comment."""
        return self.replies.all()

    def delete(self, using=None, keep_parents=False):
        """
        Soft delete this comment and cascade to its related votes.
        """
        # Soft delete the comment itself
        self.deleted_on = now()
        self.save(update_fields=["deleted_on"])

        # Soft delete related votes
        self.votes.filter(deleted_on__isnull=True).update(deleted_on=now())

        # (Optional) Soft delete child replies if you allow threaded comments
        self.replies.filter(deleted_on__isnull=True).update(deleted_on=now())

class ForumPostCommentVote(CommentVoteModel):
    comment = models.ForeignKey(ForumPostComment, related_name='votes', on_delete=models.CASCADE)
    """Model for voting on comments in forum posts. Extends CommentVote."""
    pass

# utils/models.py
from django.db import models
from api.models import TimestampedModel, RegisteredUser

# Abstract base class for posts, will be used in forum and q/a models
class PostModel(TimestampedModel):
    author = models.ForeignKey('api.RegisteredUser', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    content = models.TextField(max_length=1000)
    is_commentable = models.BooleanField(default=True)
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)

    class Meta:
        abstract = True

    def __str__(self):
        return f"Post #{self.pk}, {self.title}"

# Abstract base class for comments, will be used in forum and q/a models
class CommentModel(TimestampedModel):
    author = models.ForeignKey('api.RegisteredUser', on_delete=models.CASCADE)
    content = models.TextField(max_length=1000)
    parent_comment = models.ForeignKey(
        'self',
        related_name='replies',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    # To store depth or nesting level, was a reply to another comment or was a post comment
    level = models.PositiveIntegerField(default=0)
    upvote_count = models.PositiveIntegerField(default=0)
    downvote_count = models.PositiveIntegerField(default=0)
    reported_count = models.PositiveIntegerField(default=0)

    # This makes the model abstract and cannot be instantiated directly
    # We will use this class to create comments for posts and use as subclass
    # We don't want to create a table for this class
    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if self.parent_comment:
            self.level = self.parent_comment.level + 1
        super().save(*args, **kwargs)

    def upvote(self):
        """Increment the upvote count"""
        self.upvote_count += 1
        self.save()

    def downvote(self):
        """Increment the downvote count"""
        self.downvote_count += 1
        self.save()

    def report(self):
        """Increment the report count for the comment"""
        self.reported_count += 1
        self.save()

# Abstract base class for Comment Votes
class CommentVote(models.Model):
    VOTE_CHOICES = [
        ('up', 'Upvote'),
        ('down', 'Downvote'),
    ]

    user = models.ForeignKey(RegisteredUser, on_delete=models.CASCADE)
    comment = models.ForeignKey(CommentModel, related_name='votes', on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=5, choices=VOTE_CHOICES)

    class Meta:
        abstract = True  # This class is abstract and won't create a table directly
        unique_together = ('user', 'comment')  # Ensure one vote per user per comment

    def __str__(self):
        return f"Vote by {self.user} on comment {self.comment.id} with type {self.vote_type}"

# Abstract base class for Comment Reports
class CommentReport(models.Model):
    user = models.ForeignKey(RegisteredUser, on_delete=models.CASCADE)
    comment = models.ForeignKey(CommentModel, related_name='reports', on_delete=models.CASCADE)
    reason = models.CharField(max_length=255)

    class Meta:
        abstract = True  # This class is abstract and won't create a table directly
        unique_together = ('user', 'comment') # Ensure one report per user per comment

    def __str__(self):
        return f"Report by {self.user} on comment {self.comment.id}"
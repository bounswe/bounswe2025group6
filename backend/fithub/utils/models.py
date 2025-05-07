# utils/models.py
from django.db import models
from api.models import TimestampedModel

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
    upvote_count = models.PositiveIntegerField(default=0)
    downvote_count = models.PositiveIntegerField(default=0)
    reported_count = models.PositiveIntegerField(default=0)

    # This makes the model abstract and cannot be instantiated directly
    # We will use this class to create comments for posts and use as subclass
    # We don't want to create a table for this class
    class Meta:
        abstract = True

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
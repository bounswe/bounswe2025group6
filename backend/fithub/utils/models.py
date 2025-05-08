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

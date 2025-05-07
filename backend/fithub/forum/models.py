# forum/models.py
from django.db import models
from utils.models import Post

class ForumPost(Post):
    # The Post model already has all the necessary fields for a forum post
    # If you need to add any specific fields for ForumPost, you can do so here

    def __str__(self):
        return f"ForumPost #{self.pk}, {self.title}"
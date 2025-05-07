# forum/models.py
from django.db import models
from utils.models import Post
from api.models import TimestampedModel

class ForumPost(Post):
    # The Post model already has all the necessary fields for a forum post
    # If you need to add any specific fields for ForumPost, you can do so here
    tags = models.ManyToManyField(
        'ForumTag',
        related_name='forum_posts',
        blank=True,
    )

    def __str__(self):
        return f"ForumPost #{self.pk}, {self.title}"

class ForumTag(TimestampedModel):
    class TagChoices(models.TextChoices):
        BUDGET = 'Budget'
        MEAL_PREP = 'MealPrep'
        FAMILY = 'Family'
        NO_WASTE = 'NoWaste'
        SUSTAINABILITY = 'Sustainability'
        TIPS = 'Tips'
        GLUTEN_FREE = 'GlutenFree'
        VEGAN = 'Vegan'
        VEGETARIAN = 'Vegetarian'
        QUICK = 'Quick'
        HEALTHY = 'Healthy'
        STUDENT = 'Student'
        NUTRITION = 'Nutrition'
        HEALTHY_EATING = 'HealthyEating'
        SNACKS = 'Snacks'

    name = models.CharField(
        max_length=50,
        choices=TagChoices.choices,
        unique=True,
    )

    def save(self, *args, **kwargs):
        # Normalize the tag name to have the first letter capitalized
        self.name = self.name.capitalize()  # Ensure the format is consistent ("Tips", "Vegan", etc.)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
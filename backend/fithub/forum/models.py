# forum/models.py
from django.db import models
from utils.models import Post
from api.models import TimestampedModel

class ForumPost(Post):
    # The Post model already has all the necessary fields for a forum post
    # If you need to add any specific fields for ForumPost, you can do so here

    # Define choices for tags inside the ForumPost model
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

    # Store tags as a list of strings
    tags = models.JSONField(default=list, blank=True)  # Django 3.1+ supports JSONField

    def __str__(self):
        return f"ForumPost #{self.pk}, {self.title}"

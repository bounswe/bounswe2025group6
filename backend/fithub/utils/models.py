# utils/models.py

from django.db import models
from api.models import TimestampedModel

##################################################
###          POST RELATED MODELS START         ###
##################################################

# Concrete Tag model to categorize posts
class Tag(TimestampedModel):
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

    def __str__(self):
        return self.name

# Abstract base class for posts, will be used in forum and q/a models
class Post(TimestampedModel):
    author = models.ForeignKey('api.RegisteredUser', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    content = models.TextField(max_length=1000)
    is_commentable = models.BooleanField(default=True)
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)

    # Direct Many-to-Many relationship with Tag
    tags = models.ManyToManyField('utils.Tag', related_name='posts')

    class Meta:
        abstract = True

    def __str__(self):
        return f"Post #{self.pk}, {self.title}"

##################################################
###          POST RELATED MODELS END           ###
##################################################

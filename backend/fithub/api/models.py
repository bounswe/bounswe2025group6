from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
from django.utils.timezone import now
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator
from recipes.models import Recipe  # Import from the recipes app
from core.models import TimestampedModel  # New import path
'''

class TimestampedModel(models.Model):

    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    deleted_on = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.deleted_on = timezone.now()
        self.save()
'''

class RegisteredUser(AbstractUser, TimestampedModel):
    USER = 'user'
    DIETITIAN = 'dietitian'

    USER_TYPES = [
        (USER, 'User'),
        (DIETITIAN, 'Dietitian'),
    ]

    email = models.EmailField(unique=True)

    usertype = models.CharField(
        max_length=20,
        choices=USER_TYPES,
        default=USER,
    )

     
    profilePhoto = models.URLField(blank=True, null=True)
    foodAllergies = models.JSONField(default=list, blank=True)
    
    notificationPreferences = models.JSONField(
        default=dict,
        blank=True,
        help_text="Format: {'email': True, 'sms': False}"
    )
    
    PROFILE_VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('followers_only', 'Followers Only'),
    ]

    profileVisibility = models.CharField(
        max_length=15,
        choices=PROFILE_VISIBILITY_CHOICES,
        default='public',
    )
    
    recipeCount = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    avgRecipeRating = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)]
    )
    
    COOK_TYPE_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('expert', 'Expert'),
        ('professional', 'Professional'),
    ]
    typeOfCook = models.CharField(
        max_length=15,
        choices=COOK_TYPE_CHOICES,
        blank=True,
        null=True,
    )
    
    # Relationships
    followedUsers = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='followers',
        blank=True,
    )
    
    # Recipe relationships (assuming Recipe is in 'recipes' app)
    bookmarkRecipes = models.ManyToManyField(
        'recipes.Recipe',
        related_name='bookmarked_by',
        blank=True,
    )
    
    likedRecipes = models.ManyToManyField(
        'recipes.Recipe',
        related_name='liked_by',
        blank=True,
    )

    def __str__(self):
        return self.username

class RecipeRating(models.Model):
    user = models.ForeignKey(
        'RegisteredUser',
        on_delete=models.CASCADE,
        related_name='rated_recipes'
    )
    recipe = models.ForeignKey(
        Recipe,  # Direct reference to Recipe from recipes app
        on_delete=models.CASCADE,
        related_name='ratings'
    )
    taste_rating = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)]
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'recipe')

class Dietitian(TimestampedModel, models.Model):
    registered_user = models.OneToOneField(RegisteredUser, on_delete=models.CASCADE, related_name='dietitian')
    certification_url = models.URLField()

# the 6 digit reset token sent to user email
class PasswordResetCode(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return self.created_at + timedelta(minutes=10) < timezone.now()

# the reset token generated after user provides a verified six-digit code
class PasswordResetToken(models.Model):
    email = models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=15)

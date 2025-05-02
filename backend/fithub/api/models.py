from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.utils.timezone import now

class TimestampedModel(models.Model):
    class TimestampedModel(models.Model):
        created_at = models.DateTimeField(auto_now_add=True, null=True)
        updated_at = models.DateTimeField(auto_now=True, null=True)
        deleted_on = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.deleted_on = timezone.now()
        self.save()

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

    def __str__(self):
        return self.username
    

class Dietitian(TimestampedModel, models.Model):
    registered_user = models.OneToOneField(RegisteredUser, on_delete=models.CASCADE, related_name='dietitian')
    certification_url = models.URLField()


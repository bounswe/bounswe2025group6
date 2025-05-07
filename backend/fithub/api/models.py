from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
from django.utils.timezone import now
import uuid

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

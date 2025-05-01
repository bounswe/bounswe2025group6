from django.db import models
from django.contrib.auth.models import AbstractUser

from django.db import models
from django.contrib.auth.models import AbstractUser

class RegisteredUser(AbstractUser):
    USER = 'user'
    DIETITIAN = 'dietitian'

    USER_TYPES = [
        (USER, 'User'),
        (DIETITIAN, 'Dietitian'),
    ]

    email = models.EmailField(unique=True)  # optional override to make it unique
    usertype = models.CharField(
        max_length=20,
        choices=USER_TYPES,
        default=USER,
    )

    def __str__(self):
        return self.username
    

class Dietitian(models.Model):
    registered_user = models.OneToOneField(RegisteredUser, on_delete=models.CASCADE, related_name='dietitian')
    certification_url = models.URLField()


from django.db import models
from django.contrib.auth.models import AbstractUser

class RegisteredUser(models.Model):
    USER = 'user'
    DIETITIAN = 'dietitian'

    USER_TYPES = [
        (USER, 'User'),
        (DIETITIAN, 'Dietitian'),
    ]

    username = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=128)
    usertype = models.CharField(
        max_length=20,
        choices=USER_TYPES,
        default=USER,
    )
    

class Dietitian(models.Model):
    registered_user = models.OneToOneField(RegisteredUser, on_delete=models.CASCADE, related_name='dietitian')
    certification_url = models.URLField()


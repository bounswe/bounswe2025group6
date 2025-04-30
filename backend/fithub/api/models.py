from django.db import models
from django.contrib.auth.models import AbstractUser

class RegisteredUser(models.Model):
    username = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=128)
    usertype = models.CharField(max_length=20)  # 'user' or 'dietitian'
    

class Dietitian(models.Model):
    registered_user = models.OneToOneField(RegisteredUser, on_delete=models.CASCADE, related_name='dietitian')
    certification_url = models.URLField()


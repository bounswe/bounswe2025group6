# users/models.py
from django.db import models

class RegisteredUser(models.Model):
    
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    password_hash = models.CharField(max_length=255)
    
    
    def __str__(self):
        return self.username

# users/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class RegisteredUser(models.Model):
    
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    password_hash = models.CharField(max_length=255)

    class Meta:
        db_table = 'registered_users'  # table name in MySQL
        managed = False 
    
    
    def __str__(self):
        return self.username


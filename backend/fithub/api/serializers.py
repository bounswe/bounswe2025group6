# users/serializers.py
from rest_framework import serializers
from .models import RegisteredUser
from django.contrib.auth.hashers import make_password

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = RegisteredUser
        fields = ['username', 'email', 'password']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['password_hash'] = make_password(password)
        return RegisteredUser.objects.create(**validated_data)
    

    def create(self, validated_data):
        password = validated_data.pop('password')  # Get the plain text password
        validated_data['password_hash'] = make_password(password)  # Save hashed password in 'password_hash'
        return RegisteredUser.objects.create(**validated_data)  # Create the user with hashed password
        

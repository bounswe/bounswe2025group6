# serializers.py
from rest_framework import serializers
from .models import RegisteredUser, Dietitian
from django.contrib.auth.hashers import make_password

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = RegisteredUser
        fields = ['username', 'email', 'password','usertype', 'certification_url']

    def validate(self, attrs):
        usertype = attrs.get('usertype')
        certification = attrs.get('certification_url')

        if usertype == 'dietitian' and not certification:
            raise serializers.ValidationError({
                'certification_url': 'This field is required when usertype is "dietitian".'
            })

        return attrs
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['password_hash'] = make_password(password)
        user = RegisteredUser.objects.create(**validated_data)

        if user.usertype == 'dietitian':
            Dietitian.objects.create(
                registered_user=user,
                certification_url=certification_url
            )

        return user
        

    def create(self, validated_data):
        password = validated_data.pop('password')  # Get the plain text password
        validated_data['password_hash'] = make_password(password)  # Save hashed password in 'password_hash'
        return RegisteredUser.objects.create(**validated_data)  # Create the user with hashed password
        

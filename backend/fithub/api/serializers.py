# serializers.py
from rest_framework import serializers
from .models import RegisteredUser, Dietitian
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate

class DietitianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dietitian
        fields = ['certification_url']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    dietitian = DietitianSerializer(write_only=True, required=False)

    class Meta:
        model = RegisteredUser
        fields = ['username', 'email', 'password', 'usertype', 'dietitian']

    def validate(self, attrs):
        usertype = attrs.get('usertype')
        dietitian_data = attrs.get('dietitian')

        if usertype == 'dietitian' and not dietitian_data:
            raise serializers.ValidationError({
                'dietitian': 'This field is required when usertype is "dietitian".'
            })

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        dietitian_data = validated_data.pop('dietitian', None)

        user = RegisteredUser.objects.create(**validated_data)

         # Set the user's password (this will hash the password automatically)
        user.set_password(password)
        user.save()

        if user.usertype == 'dietitian' and dietitian_data:
            # Create Dietitian object linked to RegisteredUser
            Dietitian.objects.create(
                registered_user=user,
                certification_url=dietitian_data.get('certification_url')
            )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = RegisteredUser.objects.get(email=email)
        except RegisteredUser.DoesNotExist:
            raise serializers.ValidationError('Invalid email or password.')

        if not user.check_password(password):
            raise serializers.ValidationError('Invalid email or password.')

        attrs['user'] = user
        return attrs
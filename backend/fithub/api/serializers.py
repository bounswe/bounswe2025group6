# serializers.py
from rest_framework import serializers
from .models import RegisteredUser, Dietitian
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import PasswordResetCode
from django.utils.crypto import get_random_string
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

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
        
        if not user.is_active:
            raise serializers.ValidationError('User account is inactive.')

        attrs['user'] = user
        return attrs
    

class RequestPasswordResetCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, email):
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return email

    def save(self):
        email = self.validated_data['email']
        code = get_random_string(length=6, allowed_chars='0123456789')

        PasswordResetCode.objects.create(email=email, code=code)

        # You can send the email here using Django's email backend
        print(f"Password reset code for {email} is: {code}")  # Replace with actual email logic

        send_mail(
            subject="Your Password Reset Code",
            message=f"Use this code to reset your password: {code}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email]
        )


class VerifyPasswordResetCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, data):
        try:
            record = PasswordResetCode.objects.filter(email=data['email'], code=data['code'], is_used=False).latest('created_at')
        except PasswordResetCode.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired code.")

        if record.is_expired():
            raise serializers.ValidationError("The code has expired.")
        
        data['user'] = User.objects.get(email=data['email'])
        data['record'] = record
        return data

    def save(self):
        user = self.validated_data['user']
        new_password = self.validated_data['new_password']
        record = self.validated_data['record']

        user.set_password(new_password)
        user.save()

        record.is_used = True
        record.save()
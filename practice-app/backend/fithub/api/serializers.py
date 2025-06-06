# serializers.py
from rest_framework import serializers
from .models import RegisteredUser, Dietitian
from django.contrib.auth.models import User
from .models import PasswordResetCode, PasswordResetToken
from django.utils.crypto import get_random_string
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from recipes.models import Recipe  # Import from recipes app
from .models import RegisteredUser, RecipeRating

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


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, data):
        try:
            reset_token = PasswordResetToken.objects.get(token=data['token'])
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired token.")

        if reset_token.is_expired():
            raise serializers.ValidationError("The token has expired.")

        try:
            user = User.objects.get(email=reset_token.email)
        except User.DoesNotExist:
            # This case should ideally not happen if token is valid and tied to an email
            raise serializers.ValidationError("User not found.")

        # Add validation for old password
        if user.check_password(data['new_password']):
            raise serializers.ValidationError({"new_password": "New password cannot be the same as your old password."})

        data['user'] = user
        data['reset_token'] = reset_token
        return data

    def save(self):
        user = self.validated_data['user']
        # The new_password has already been validated against the old one in the validate method
        user.set_password(self.validated_data['new_password'])
        user.save()

        self.validated_data['reset_token'].delete()


class RegisteredUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegisteredUser
        fields = [
            'id', 'username', 'email', 'usertype', 
            'profilePhoto', 'foodAllergies', 'notificationPreferences',
            'profileVisibility', 'recipeCount', 'avgRecipeRating',
            'typeOfCook', 'followedUsers', 'bookmarkRecipes', 'likedRecipes',
        ]
        extra_kwargs = {
            'password': {'write_only': True},  # Hide password in responses
        }

    def validate_avgRecipeRating(self, value):
        if value < 0.0 or value > 5.0:
            raise serializers.ValidationError("Rating must be between 0.0 and 5.0.")
        return value

#UNDER CONSTRUCTION
class RecipeRatingSerializer(serializers.ModelSerializer):
    recipe_id = serializers.PrimaryKeyRelatedField(
        queryset=Recipe.objects.all(),
        source='recipe',
        write_only=True
    )
    recipe_title = serializers.CharField(
        source='recipe.title',
        read_only=True
    )

    class Meta:
        model = RecipeRating
        fields = ['id', 'user', 'recipe_id', 'recipe_title', 'taste_rating', 'difficulty_rating', 'timestamp']
        read_only_fields = ['user', 'timestamp', 'recipe', 'recipe_title']
        extra_kwargs = {
            'taste_rating': {'required': False, 'allow_null': True},
            'difficulty_rating': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        """Ensure at least one rating is provided"""
        if data.get('taste_rating') is None and data.get('difficulty_rating') is None:
            raise serializers.ValidationError("At least one rating (taste or difficulty) must be provided")
        return data

    def create(self, validated_data):
        """Override create to handle partial ratings"""
        # Ensure at least one rating is provided
        if validated_data.get('taste_rating') is None and validated_data.get('difficulty_rating') is None:
            raise serializers.ValidationError("At least one rating must be provided")
        
        # Set default values if not provided
        if validated_data.get('taste_rating') is None:
            validated_data['taste_rating'] = None
        if validated_data.get('difficulty_rating') is None:
            validated_data['difficulty_rating'] = None
            
        return super().create(validated_data)



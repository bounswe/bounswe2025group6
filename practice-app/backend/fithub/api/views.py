from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.contrib.sites.shortcuts import get_current_site
from django.contrib.auth.hashers import make_password
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import RegisteredUser, RecipeRating, HealthRating
from recipes.models import Recipe  # Import from recipes app
from forum.models import ForumPost, ForumPostComment  # Import for posts and comments
from qa.models import Question, Answer  # Import for questions and answers
from rest_framework import serializers
import copy
from django.db import transaction
from rest_framework.permissions import BasePermission
from .serializers import HealthRatingSerializer


from .serializers import (UserRegistrationSerializer, LoginSerializer, RequestPasswordResetCodeSerializer,
                           VerifyPasswordResetCodeSerializer, ResetPasswordSerializer,PasswordResetToken, RegisteredUserSerializer, RecipeRatingSerializer)

User = get_user_model()

# Lightweight serializers only for Swagger docs to avoid nested param errors
class UserProfileCreateSwaggerSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField()
    usertype = serializers.ChoiceField(choices=RegisteredUser.USER_TYPES, required=False)
    profilePhoto = serializers.ImageField(required=False, allow_null=True)
    language = serializers.ChoiceField(choices=RegisteredUser.LANGUAGES, required=False)
    preferredDateFormat = serializers.ChoiceField(choices=RegisteredUser.DATE_FORMATS, required=False)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    nationality = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    preferredCurrency = serializers.ChoiceField(choices=RegisteredUser.CURRENCY_CHOICES, required=False)
    accessibilityNeeds = serializers.ChoiceField(choices=RegisteredUser.ACCESIBILITY_CHOICES, required=False)
    foodAllergies = serializers.ListField(child=serializers.CharField(), required=False)
    notificationPreferences = serializers.JSONField(required=False)
    profileVisibility = serializers.ChoiceField(choices=RegisteredUser.PROFILE_VISIBILITY_CHOICES, required=False)
    typeOfCook = serializers.ChoiceField(choices=RegisteredUser.COOK_TYPE_CHOICES, required=False, allow_null=True)
    certification_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)

class UserProfileUpdateSwaggerSerializer(UserProfileCreateSwaggerSerializer):
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(required=False)

def index(request):
    return HttpResponse("API OK")

@swagger_auto_schema(
    method='post',
    tags = ["Registration"],
    request_body=UserRegistrationSerializer(),
)
@api_view(['POST'])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        # Get the password from the incoming request
        password = request.data.get('password')
        if password:
            # Manually hash the password if necessary (optional)
            request.data['password'] = make_password(password)
        else:
            return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        user.is_active = False  # Require email verification before login
        user.save()

        send_verification_email(user, request)

        return Response({'detail': 'User registered. Please check your email to verify your account.'}, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def send_verification_email(user, request):
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    domain = get_current_site(request).domain
    link = reverse('email-verify', kwargs={'uidb64': uid, 'token': token})
    verify_url = f'{settings.SITE_DOMAIN}{link}'

    subject = 'Verify your email'
    message = f'Click the link to verify your account: {verify_url}'
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])


@swagger_auto_schema(
    method='GET',
    tags=['Registration'],  # Assigns this endpoint to the "Authentication" tag
    operation_summary="Verify user email",
    operation_description="Verifies a user's email using a unique token and UID.",
    manual_parameters=[
        openapi.Parameter(
            name='uidb64',
            in_=openapi.IN_PATH,
            type=openapi.TYPE_STRING,
            description="Base64-encoded user ID",
            required=True,
        ),
        openapi.Parameter(
            name='token',
            in_=openapi.IN_PATH,
            type=openapi.TYPE_STRING,
            description="Email verification token",
            required=True,
        ),
    ],
    responses={
        200: openapi.Response(
            description="Email verified successfully",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'detail': openapi.Schema(type=openapi.TYPE_STRING, example="Email successfully verified!"),
                },
            ),
        ),
        400: openapi.Response(
            description="Invalid verification link",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'error': openapi.Schema(type=openapi.TYPE_STRING, example="Verification link is invalid or has expired."),
                },
            ),
        ),
    },
)
@api_view(['GET'])
def verify_email(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = get_object_or_404(User, pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'error': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)

    if default_token_generator.check_token(user, token):
        user.is_active = True
        user.save()
        return Response({'detail': 'Email successfully verified!'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Verification link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

send_mail(
    'Test Email',
    'This is a test email.',
    settings.DEFAULT_FROM_EMAIL,
    [''],
    fail_silently=False,
)

@swagger_auto_schema(
    method='post',
    tags = ["Password Reset via Email Link Workflow"],
    consumes=['application/json'],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'email': openapi.Schema(type=openapi.TYPE_STRING, description='Email of the user to reset password'),
        },
        required=['email']
    ),
    responses={
        200: openapi.Response(description="Password reset email sent."),
        400: openapi.Response(description="Invalid email."),
    }
)

@api_view(['POST'])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"detail": "Please check your inbox and junk folder for the password reset email"}, status=status.HTTP_200_OK)

    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    reset_url = reverse('password-reset', kwargs={'uidb64': uid, 'token': token})
    reset_link = f'{settings.SITE_DOMAIN}{reset_url}'

    subject = "Fithub Password Reset Request"
    message = f"To reset your password, click the following link: {reset_link}"
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])

    return Response({"detail": "If this email exists, a password reset link has been sent."}, status=status.HTTP_200_OK)

@swagger_auto_schema(
    method='post',
    tags = ["Password Reset via Email Link Workflow"],
    consumes=['application/json'],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'new_password': openapi.Schema(type=openapi.TYPE_STRING, description='New password for the user'),
        },
    ),
    responses={
        200: openapi.Response(description='Password has been reset successfully.'),
        400: openapi.Response(description='Invalid token or password missing.'),
    },
)
@api_view(['POST'])
def password_reset(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, OverflowError):
        return Response({"error": "Invalid token or user."}, status=status.HTTP_400_BAD_REQUEST)

    if default_token_generator.check_token(user, token):
        new_password = request.data.get("new_password")
        if new_password:
            user.password = make_password(new_password)
            user.save()
            return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)
        return Response({"error": "New password is required."}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

class RequestResetCodeView(APIView):
    @swagger_auto_schema(
        operation_description="Request a 6-digit password reset code to be sent to your email.",
        tags = ["Password Reset via 6-Digit Code Workflow"],
        request_body=RequestPasswordResetCodeSerializer,
        responses={200: "Code sent", 400: "Validation error"}
    )
    def post(self, request):
        serializer = RequestPasswordResetCodeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()

            return Response({"detail": "A reset code has been sent to your email."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class VerifyResetCodeView(APIView):
    @swagger_auto_schema(
        operation_description="Verify 6-digit password reset code for the given email.",
        tags = ["Password Reset via 6-Digit Code Workflow"],
        request_body=VerifyPasswordResetCodeSerializer,
        responses={200: "Code verified and temporary token issued", 400: "Validation error"}
    )
    def post(self, request):
        serializer = VerifyPasswordResetCodeSerializer(data=request.data)
        if serializer.is_valid():
            record = serializer.validated_data['record']
            record.is_used = True
            record.save()

            # Create a temporary token
            token = PasswordResetToken.objects.create(email=record.email)

            return Response(
                {"detail": "Code verified.", "token": str(token.token)},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    @swagger_auto_schema(
        operation_description="Reset password using a temporary token and new password.",
        tags = ["Password Reset via 6-Digit Code Workflow"],
        request_body=ResetPasswordSerializer,
        responses={200: "Password reset successful", 400: "Validation error"}
    )
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Password has been successfully reset."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from .models import LoginAttempt

class login_view(APIView):
    @swagger_auto_schema(
        request_body=LoginSerializer(),
        responses={
            200: 'Successful login response with token',
            400: 'Bad request',
            401: 'Invalid credentials, inactive account, or deleted account',
            429: 'Too many failed attempts'
        }
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            # Check if the error is related to authentication (inactive, deleted, invalid credentials)
            # These should return 401 instead of 400
            error_messages = serializer.errors
            if isinstance(error_messages, dict):
                # Check for non-field errors that indicate auth issues
                non_field_errors = error_messages.get('non_field_errors', [])
                if non_field_errors:
                    # Get the first error message
                    error_message = non_field_errors[0] if isinstance(non_field_errors, list) else non_field_errors
                    error_text = str(error_message).lower()
                    # Check for authentication-related errors
                    if any(keyword in error_text for keyword in ['deleted', 'inactive', 'invalid email or password']):
                        return Response(
                            {"error": str(error_message)},
                            status=status.HTTP_401_UNAUTHORIZED
                        )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid credentials"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check if user is soft deleted (deleted_on is not None)
        # This is a defensive check, though the serializer should have caught this already
        if user.deleted_on is not None:
            return Response(
                {"error": "User account has been deleted."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check for too many failed attempts
        recent_attempts = LoginAttempt.get_recent_attempts(
            user, 
            minutes=settings.LOGIN_ATTEMPT_TIMEOUT
        )
        
        if recent_attempts >= settings.LOGIN_ATTEMPT_LIMIT:
            return Response(
                {
                    "error": "Account temporarily locked due to too many failed attempts. "
                            f"Please try again in {settings.LOGIN_ATTEMPT_TIMEOUT} minutes."
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Attempt authentication
        if serializer.validated_data.get('user') == user:
            # Successful login
            LoginAttempt.objects.create(user=user, successful=True)
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'usertype': user.usertype,
            })
        else:
            # Failed login
            LoginAttempt.objects.create(user=user, successful=False)
            print("Failed login attempt recorded.")
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

class logout_view(APIView):
    permission_classes = [IsAuthenticated]
    @swagger_auto_schema(
        operation_description="Logs out the user by deleting the authentication token.",
        produces=["application/json"],
        manual_parameters=[
            openapi.Parameter(
                'Authorization',
                openapi.IN_HEADER,
                description="Token-based authorization. Format: `Token <your_token>`",
                type=openapi.TYPE_STRING,
                required=True
            )
        ],
        responses={
            200: openapi.Response(description="Logout successful"),
            400: openapi.Response(description="No token found"),
            401: openapi.Response(description="User not authenticated"),
        }
    )
    def post(self, request):
        try:
            # Get the token associated with the current user
            token = Token.objects.get(user=request.user)
            token.delete()  # Delete the token to log out the user
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Token.DoesNotExist:
            return Response({"detail": "No token found."}, status=status.HTTP_400_BAD_REQUEST)


@swagger_auto_schema(
    method='GET',
    operation_description="Get user ID by email address",
    manual_parameters=[
        openapi.Parameter(
            name='email',
            in_=openapi.IN_QUERY,
            description="User's email address",
            type=openapi.TYPE_STRING,
            required=True
        )
    ],
    responses={
        200: openapi.Response(
            description="Successfully found user",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER, description='User ID')
                }
            )
        ),
        400: openapi.Response(
            description="Bad request - missing email parameter",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'error': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        ),
        404: openapi.Response(
            description="User not found",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'error': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        )
    }
)

@api_view(['GET'])
def get_user_id_by_email(request):
    email = request.query_params.get('email')
    if not email:
        return Response(
            {"error": "Email parameter is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = RegisteredUser.objects.get(email=email)
        return Response({"id": user.id}, status=status.HTTP_200_OK)
    except RegisteredUser.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

@swagger_auto_schema(
    method='GET',
    operation_description="Get recipe IDs created by a specific user",
    manual_parameters=[
        openapi.Parameter(
            name='user_id',
            in_=openapi.IN_PATH,
            description="User ID",
            type=openapi.TYPE_INTEGER,
            required=True
        )
    ],
    responses={
        200: openapi.Response(
            description="List of recipe IDs",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'recipe_ids': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(type=openapi.TYPE_INTEGER),
                        description='List of recipe IDs'
                    )
                }
            )
        ),
        404: openapi.Response(
            description="User not found",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'error': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        )
    }
)
@api_view(['GET'])
def get_user_recipe_ids(request, user_id):
    """
    Fast endpoint to get all recipe IDs created by a specific user.
    Returns only IDs (not full recipe objects) for optimal performance.
    """
    try:
        user = RegisteredUser.objects.get(pk=user_id)
    except RegisteredUser.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Fast query: only get IDs, filter out soft-deleted recipes
    recipe_ids = list(Recipe.objects.filter(
        creator_id=user_id,
        deleted_on__isnull=True
    ).values_list('id', flat=True))
    
    return Response({"recipe_ids": recipe_ids}, status=status.HTTP_200_OK)

@swagger_auto_schema(
    method='GET',
    operation_description="Get comment IDs created by a specific user",
    manual_parameters=[
        openapi.Parameter(
            name='user_id',
            in_=openapi.IN_PATH,
            description="User ID",
            type=openapi.TYPE_INTEGER,
            required=True
        )
    ],
    responses={
        200: openapi.Response(
            description="List of comment IDs",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'comment_ids': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(type=openapi.TYPE_INTEGER),
                        description='List of comment IDs'
                    )
                }
            )
        ),
        404: openapi.Response(
            description="User not found",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'error': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        )
    }
)
@api_view(['GET'])
def get_user_comment_ids(request, user_id):
    """
    Fast endpoint to get all comment IDs created by a specific user.
    Returns only IDs (not full comment objects) for optimal performance.
    """
    try:
        user = RegisteredUser.objects.get(pk=user_id)
    except RegisteredUser.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Fast query: only get IDs, filter out soft-deleted comments
    comment_ids = list(ForumPostComment.objects.filter(
        author_id=user_id,
        deleted_on__isnull=True
    ).values_list('id', flat=True))
    
    return Response({"comment_ids": comment_ids}, status=status.HTTP_200_OK)

@swagger_auto_schema(
    method='GET',
    operation_description="Get post IDs created by a specific user",
    manual_parameters=[
        openapi.Parameter(
            name='user_id',
            in_=openapi.IN_PATH,
            description="User ID",
            type=openapi.TYPE_INTEGER,
            required=True
        )
    ],
    responses={
        200: openapi.Response(
            description="List of post IDs",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'post_ids': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(type=openapi.TYPE_INTEGER),
                        description='List of post IDs'
                    )
                }
            )
        ),
        404: openapi.Response(
            description="User not found",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'error': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        )
    }
)
@api_view(['GET'])
def get_user_post_ids(request, user_id):
    """
    Fast endpoint to get all post IDs created by a specific user.
    Returns only IDs (not full post objects) for optimal performance.
    """
    try:
        user = RegisteredUser.objects.get(pk=user_id)
    except RegisteredUser.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Fast query: only get IDs, filter out soft-deleted posts
    post_ids = list(ForumPost.objects.filter(
        author_id=user_id,
        deleted_on__isnull=True
    ).values_list('id', flat=True))
    
    return Response({"post_ids": post_ids}, status=status.HTTP_200_OK)

@swagger_auto_schema(
    method='GET',
    operation_description="Get question IDs created by a specific user",
    manual_parameters=[
        openapi.Parameter(
            name='user_id',
            in_=openapi.IN_PATH,
            description="User ID",
            type=openapi.TYPE_INTEGER,
            required=True
        )
    ],
    responses={
        200: openapi.Response(
            description="List of question IDs",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'question_ids': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(type=openapi.TYPE_INTEGER),
                        description='List of question IDs'
                    )
                }
            )
        ),
        404: openapi.Response(
            description="User not found",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'error': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        )
    }
)
@api_view(['GET'])
def get_user_question_ids(request, user_id):
    """
    Fast endpoint to get all question IDs created by a specific user.
    Returns only IDs (not full question objects) for optimal performance.
    """
    try:
        user = RegisteredUser.objects.get(pk=user_id)
    except RegisteredUser.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Fast query: only get IDs, filter out soft-deleted questions
    question_ids = list(Question.objects.filter(
        author_id=user_id,
        deleted_on__isnull=True
    ).values_list('id', flat=True))
    
    return Response({"question_ids": question_ids}, status=status.HTTP_200_OK)

@swagger_auto_schema(
    method='GET',
    operation_description="Get answer IDs created by a specific user",
    manual_parameters=[
        openapi.Parameter(
            name='user_id',
            in_=openapi.IN_PATH,
            description="User ID",
            type=openapi.TYPE_INTEGER,
            required=True
        )
    ],
    responses={
        200: openapi.Response(
            description="List of answer IDs",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'answer_ids': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(type=openapi.TYPE_INTEGER),
                        description='List of answer IDs'
                    )
                }
            )
        ),
        404: openapi.Response(
            description="User not found",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'error': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        )
    }
)
@api_view(['GET'])
def get_user_answer_ids(request, user_id):
    """
    Fast endpoint to get all answer IDs created by a specific user.
    Returns only IDs (not full answer objects) for optimal performance.
    """
    try:
        user = RegisteredUser.objects.get(pk=user_id)
    except RegisteredUser.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Fast query: only get IDs, filter out soft-deleted answers
    answer_ids = list(Answer.objects.filter(
        author_id=user_id,
        deleted_on__isnull=True
    ).values_list('id', flat=True))
    
    return Response({"answer_ids": answer_ids}, status=status.HTTP_200_OK)


@swagger_auto_schema(
    method='GET',
    operation_description="Get activity stream from all followed users",
    manual_parameters=[
        openapi.Parameter(
            name='page',
            in_=openapi.IN_QUERY,
            description="Page number for pagination",
            type=openapi.TYPE_INTEGER,
            required=False
        ),
        openapi.Parameter(
            name='page_size',
            in_=openapi.IN_QUERY,
            description="Number of items per page (default: 20, max: 100)",
            type=openapi.TYPE_INTEGER,
            required=False
        ),
        openapi.Parameter(
            name='activity_type',
            in_=openapi.IN_QUERY,
            description="Filter by activity type: recipe, post, comment, question, answer",
            type=openapi.TYPE_STRING,
            enum=['recipe', 'post', 'comment', 'question', 'answer'],
            required=False
        ),
    ],
    responses={
        200: openapi.Response(
            description="Activity stream from followed users",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'page': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'page_size': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'total': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'results': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'activity_type': openapi.Schema(type=openapi.TYPE_STRING),
                                'activity_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'user_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'user_username': openapi.Schema(type=openapi.TYPE_STRING),
                                'user_profile_photo': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_URI),
                                'timestamp': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME),
                                'title': openapi.Schema(type=openapi.TYPE_STRING),
                                'content': openapi.Schema(type=openapi.TYPE_STRING),
                                'target_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'target_title': openapi.Schema(type=openapi.TYPE_STRING),
                                'metadata': openapi.Schema(type=openapi.TYPE_OBJECT),
                            }
                        )
                    )
                }
            )
        ),
        401: openapi.Response(description="Unauthorized - authentication required")
    },
    security=[{"Bearer": []}],
    tags=['Activity Stream']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_stream(request):
    """
    Get activity stream showing all activities from users that the authenticated user follows.
    
    Activities include:
    - Recipe creation
    - Forum post creation
    - Forum post comments
    - Question creation
    - Answer creation
    
    Activities are sorted by timestamp (most recent first) and paginated.
    """
    from utils.pagination import StandardPagination
    from .serializers import ActivityStreamSerializer
    
    user = request.user
    
    # Get list of followed user IDs
    followed_user_ids = user.followedUsers.values_list('id', flat=True)
    
    if not followed_user_ids:
        # Return empty result if not following anyone
        paginator = StandardPagination()
        page_size = paginator.get_page_size(request)
        return Response({
            'page': 1,
            'page_size': page_size,
            'total': 0,
            'results': [],
        })
    
    # Get activity type filter if provided
    activity_type_filter = request.query_params.get('activity_type')
    
    activities = []
    
    # 1. Recipe creations
    if not activity_type_filter or activity_type_filter == 'recipe':
        recipes = Recipe.objects.filter(
            creator_id__in=followed_user_ids,
            deleted_on__isnull=True
        ).select_related('creator').order_by('-created_at')
        
        for recipe in recipes:
            activities.append({
                'activity_type': 'recipe',
                'activity_id': recipe.id,
                'user_id': recipe.creator.id,
                'user_username': recipe.creator.username,
                'user_profile_photo': recipe.creator.profilePhoto.url if recipe.creator.profilePhoto else None,
                'timestamp': recipe.created_at,
                'title': recipe.name,
                'content': f"Created recipe: {recipe.name}",
                'target_id': recipe.id,
                'target_title': recipe.name,
                'metadata': {
                    'meal_type': recipe.meal_type,
                    'prep_time': recipe.prep_time,
                    'cook_time': recipe.cook_time,
                }
            })
    
    # 2. Forum post creations
    if not activity_type_filter or activity_type_filter == 'post':
        posts = ForumPost.objects.filter(
            author_id__in=followed_user_ids,
            deleted_on__isnull=True
        ).select_related('author').order_by('-created_at')
        
        for post in posts:
            activities.append({
                'activity_type': 'post',
                'activity_id': post.id,
                'user_id': post.author.id,
                'user_username': post.author.username,
                'user_profile_photo': post.author.profilePhoto.url if post.author.profilePhoto else None,
                'timestamp': post.created_at,
                'title': post.title,
                'content': post.content[:200] if post.content else '',  # Truncate for preview
                'target_id': post.id,
                'target_title': post.title,
                'metadata': {
                    'tags': post.tags,
                    'upvote_count': post.upvote_count,
                    'downvote_count': post.downvote_count,
                }
            })
    
    # 3. Forum post comments
    if not activity_type_filter or activity_type_filter == 'comment':
        comments = ForumPostComment.objects.filter(
            author_id__in=followed_user_ids,
            deleted_on__isnull=True
        ).select_related('author', 'post').order_by('-created_at')
        
        for comment in comments:
            activities.append({
                'activity_type': 'comment',
                'activity_id': comment.id,
                'user_id': comment.author.id,
                'user_username': comment.author.username,
                'user_profile_photo': comment.author.profilePhoto.url if comment.author.profilePhoto else None,
                'timestamp': comment.created_at,
                'title': f"Commented on: {comment.post.title}",
                'content': comment.content[:200] if comment.content else '',
                'target_id': comment.post.id,
                'target_title': comment.post.title,
                'metadata': {
                    'post_id': comment.post.id,
                    'level': comment.level,
                    'upvote_count': comment.upvote_count,
                }
            })
    
    # 4. Question creations
    if not activity_type_filter or activity_type_filter == 'question':
        questions = Question.objects.filter(
            author_id__in=followed_user_ids,
            deleted_on__isnull=True
        ).select_related('author').order_by('-created_at')
        
        for question in questions:
            activities.append({
                'activity_type': 'question',
                'activity_id': question.id,
                'user_id': question.author.id,
                'user_username': question.author.username,
                'user_profile_photo': question.author.profilePhoto.url if question.author.profilePhoto else None,
                'timestamp': question.created_at,
                'title': question.title,
                'content': question.content[:200] if question.content else '',
                'target_id': question.id,
                'target_title': question.title,
                'metadata': {
                    'tags': question.tags,
                    'upvote_count': question.upvote_count,
                    'downvote_count': question.downvote_count,
                }
            })
    
    # 5. Answer creations
    if not activity_type_filter or activity_type_filter == 'answer':
        answers = Answer.objects.filter(
            author_id__in=followed_user_ids,
            deleted_on__isnull=True
        ).select_related('author', 'post').order_by('-created_at')
        
        for answer in answers:
            activities.append({
                'activity_type': 'answer',
                'activity_id': answer.id,
                'user_id': answer.author.id,
                'user_username': answer.author.username,
                'user_profile_photo': answer.author.profilePhoto.url if answer.author.profilePhoto else None,
                'timestamp': answer.created_at,
                'title': f"Answered: {answer.post.title}",
                'content': answer.content[:200] if answer.content else '',
                'target_id': answer.post.id,
                'target_title': answer.post.title,
                'metadata': {
                    'question_id': answer.post.id,
                    'level': answer.level,
                    'upvote_count': answer.upvote_count,
                }
            })
    
    # Sort all activities by timestamp (most recent first)
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Paginate results manually (since activities is a list, not a queryset)
    paginator = StandardPagination()
    
    # Get pagination parameters
    page_size = paginator.get_page_size(request)
    page_number = request.query_params.get('page', 1)
    
    try:
        page_number = int(page_number)
    except (TypeError, ValueError):
        page_number = 1
    
    # Calculate pagination
    total = len(activities)
    start_index = (page_number - 1) * page_size
    end_index = start_index + page_size
    paginated_activities = activities[start_index:end_index]
    
    # Serialize the results
    serializer = ActivityStreamSerializer(paginated_activities, many=True)
    
    # Return paginated response
    return Response({
        'page': page_number,
        'page_size': page_size,
        'total': total,
        'results': serializer.data,
    })


class RegisteredUserViewSet(viewsets.ModelViewSet):
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    queryset = RegisteredUser.objects.all()
    serializer_class = RegisteredUserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Adjust as needed
    
    def get_serializer_class(self):
        # Use registration serializer for create to include password + image upload
        if self.action == 'create':
            return UserRegistrationSerializer
        return RegisteredUserSerializer
    
    @swagger_auto_schema(tags=["User Profile"])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(tags=["User Profile"])
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=["User Profile"],
        request_body=UserProfileCreateSwaggerSerializer()
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=["User Profile"],
        request_body=UserProfileUpdateSwaggerSerializer()
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=["User Profile"],
        request_body=UserProfileUpdateSwaggerSerializer()
    )
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()

    @swagger_auto_schema(tags=["User Profile"])
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @swagger_auto_schema(
        method='post',
        operation_description="Follow or unfollow another user by ID",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['user_id'],
            properties={
                'user_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="ID of the user to follow/unfollow"
                )
            }
        ),
        consumes=['application/json'],
        responses={
            200: openapi.Response(
                description="Successfully followed/unfollowed",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            enum=['followed', 'unfollowed'],
                            description="Indicates whether the user was followed or unfollowed"
                        ),
                        'target_user_id': openapi.Schema(
                            type=openapi.TYPE_INTEGER,
                            description="ID of the user that was followed/unfollowed"
                        ),
                        'current_followers_count': openapi.Schema(
                            type=openapi.TYPE_INTEGER,
                            description="Updated count of the target user's followers"
                        )
                    },
                    examples={
                        "application/json": {
                            "status": "followed",
                            "target_user_id": 123,
                            "current_followers_count": 42
                        }
                    }
                )
            ),
            400: openapi.Response(
                description="Bad request",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'error': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            examples=[
                                "You cannot follow yourself.",
                                "user_id is required."
                            ]
                        )
                    }
                )
            ),
            401: openapi.Response(
                description="Unauthorized - authentication required"
            ),
            404: openapi.Response(
                description="User not found",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'error': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            example="Target user not found"
                        )
                    }
                )
            )
        },
        security=[{"Bearer": []}],
        tags=['User Actions']
    )
    @action(detail=False, methods=['post'])
    def follow(self, request):
        """
        Toggle follow status for another user by providing their user ID.
        
        This endpoint:
        - Creates a mutual follow relationship if not already following
        - Removes the mutual follow relationship if already following
        - Automatically maintains both followedUsers and followers lists
        - Prevents users from following themselves
        
        Requires:
        - Authentication via Bearer token
        - user_id in request body
        
        Returns:
            Success: {
                'status': 'followed/unfollowed', 
                'target_user_id': <id>,
                'current_followers_count': <count>
            }
            Error: {'error': <message>}
        """
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {"error": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            target_user = RegisteredUser.objects.get(pk=user_id)
        except RegisteredUser.DoesNotExist:
            return Response(
                {"error": "Target user not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        current_user = request.user

        if current_user.id == target_user.id:
            return Response(
                {"error": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already following (using either side of the relationship)
        already_following = current_user.followedUsers.filter(pk=target_user.pk).exists()

        if already_following:
            # Remove from both sides of the relationship
            current_user.followedUsers.remove(target_user)
            target_user.followers.remove(current_user)
            status_msg = "unfollowed"
        else:
            # Add to both sides of the relationship
            current_user.followedUsers.add(target_user)
            target_user.followers.add(current_user)
            status_msg = "followed"

        # Refresh to get updated count
        target_user.refresh_from_db()
        
        return Response({
            "status": status_msg,
            "target_user_id": target_user.id,
            "current_followers_count": target_user.followers.count()
        })

    @swagger_auto_schema(
        method='post',
        operation_description="Bookmark a recipe for the current user",
        tags=['User Actions'],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['recipe_id'],
            properties={
                'recipe_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="ID of the recipe to bookmark"
                )
            }
        ),
        responses={
            200: openapi.Response(
                description="Recipe bookmarked successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Confirmation message"
                        )
                    }
                ),
                examples={
                    "application/json": {
                        "status": "recipe bookmarked"
                    }
                }
            ),
            400: openapi.Response(
                description="Bad request - missing recipe_id",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'error': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                ),
                examples={
                    "application/json": {
                        "error": "recipe_id is required."
                    }
                }
            ),
            401: openapi.Response(
                description="Unauthorized - user not authenticated"
            )
        },
        consumes=['application/json'],
        security=[{"Bearer": []}]
    )
    @action(detail=False, methods=['post'])
    def bookmark_recipe(self, request):
        """
        Bookmark a recipe for the currently authenticated user.
        
        This endpoint allows users to save recipes to their bookmark list for
        easy access later. Each user can bookmark multiple recipes.
        """
        recipe_id = request.data.get('recipe_id')
        if not recipe_id:
            return Response(
                {"error": "recipe_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_user = request.user
        current_user.bookmarkRecipes.add(recipe_id)
        return Response({"status": "recipe bookmarked"})
    
    @swagger_auto_schema(
        method='post',
        operation_description="Unbookmark a recipe for the current user",
        tags=['User Actions'],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['recipe_id'],
            properties={
                'recipe_id': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="ID of the recipe to unbookmark"
                )
            }
        ),
        responses={
            200: openapi.Response(
                description="Recipe unbookmarked successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(
                            type=openapi.TYPE_STRING,
                            description="Confirmation message"
                        )
                    }
                ),
                examples={
                    "application/json": {
                        "status": "recipe unbookmarked"
                    }
                }
            ),
            400: openapi.Response(
                description="Bad request - missing recipe_id or recipe not bookmarked",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'error': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                ),
                examples={
                    "application/json": {
                        "error": "recipe_id is required."
                    }
                }
            ),
            404: openapi.Response(
                description="Recipe not found",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'error': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                ),
                examples={
                    "application/json": {
                        "error": "Recipe not found"
                    }
                }
            ),
            401: openapi.Response(
                description="Unauthorized - user not authenticated"
            )
        },
        consumes=['application/json'],
        security=[{"Bearer": []}]
    )
    @action(detail=False, methods=['post'])
    def unbookmark_recipe(self, request):
        """
        Unbookmark a recipe for the currently authenticated user.
        
        This endpoint allows users to remove recipes from their bookmark list.
        If the recipe is not bookmarked, an error will be returned.
        """
        recipe_id = request.data.get('recipe_id')
        if not recipe_id:
            return Response(
                {"error": "recipe_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if recipe exists
        try:
            recipe = Recipe.objects.get(pk=recipe_id)
        except Recipe.DoesNotExist:
            return Response(
                {"error": "Recipe not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        current_user = request.user
        
        # Check if recipe is bookmarked
        if not current_user.bookmarkRecipes.filter(pk=recipe_id).exists():
            return Response(
                {"error": "Recipe is not bookmarked."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        current_user.bookmarkRecipes.remove(recipe_id)
        return Response({"status": "recipe unbookmarked"})
    
    #RATE RECIPE SWAGGER
    @swagger_auto_schema(
        operation_description="Submit a rating for a specific recipe",
        tags=["User Actions"],
        request_body=RecipeRatingSerializer,
        responses={
            200: openapi.Response("Rating saved", RecipeRatingSerializer),
            400: openapi.Response("Error", openapi.Schema(type=openapi.TYPE_OBJECT, properties={
                'error': openapi.Schema(type=openapi.TYPE_STRING, description='Error message')
            })),
        }
    )

    @action(detail=False, methods=['post'])
    def rate_recipe(self, request):
        """
        Submit a rating for a specific recipe.
        
        Users can rate recipes on taste and/or difficulty (0.0-5.0).
        At least one rating must be provided.
        Each user can only rate a recipe once.
        """
        serializer = RecipeRatingSerializer(data=request.data)
        
        if serializer.is_valid():
            recipe = serializer.validated_data['recipe']
            
            # Check for existing rating
            if RecipeRating.objects.filter(user=request.user, recipe=recipe).exists():
                return Response(
                    {"error": "You have already rated this recipe."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create rating with provided fields
            rating = RecipeRating.objects.create(
                user=request.user,
                recipe=recipe,
                taste_rating=serializer.validated_data.get('taste_rating'),
                difficulty_rating=serializer.validated_data.get('difficulty_rating')
            )

            # Update recipe stats for provided ratings
            if rating.taste_rating is not None:
                recipe.update_ratings('taste', rating.taste_rating)
            if rating.difficulty_rating is not None:
                recipe.update_ratings('difficulty', rating.difficulty_rating)

            return Response(
            RecipeRatingSerializer(rating).data,
            status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RecipeRatingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Recipe Ratings
    """
    swagger_tags = ['Recipe Ratings']
    queryset = RecipeRating.objects.all()
    serializer_class = RecipeRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # short-circuit schema generation
        if getattr(self, 'swagger_fake_view', False):
            return RecipeRating.objects.none()
        return self.queryset.filter(user=self.request.user)

    @swagger_auto_schema(
        operation_summary="List your recipe ratings",
        tags=["Recipe Ratings"],
        responses={200: RecipeRatingSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Retrieve a single recipe rating",
        tags=["Recipe Ratings"],
        responses={200: RecipeRatingSerializer()}
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Create a new recipe rating",
        tags=["Recipe Ratings"],
        request_body=RecipeRatingSerializer,
        responses={201: RecipeRatingSerializer()}
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Replace an existing recipe rating",
        tags=["Recipe Ratings"],
        request_body=RecipeRatingSerializer,
        responses={200: RecipeRatingSerializer()}
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Partially update a recipe rating",
        tags=["Recipe Ratings"],
        request_body=RecipeRatingSerializer,
        responses={200: RecipeRatingSerializer()}
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Delete a recipe rating",
        tags=["Recipe Ratings"],
        responses={204: None}
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        rating = serializer.save(user=self.request.user)
        self._update_recipe_stats(rating)

    def perform_update(self, serializer):
        # 1) Snapshot the old rating from the database
        old_rating = RecipeRating.objects.get(pk=serializer.instance.pk)

        # 2) Atomically remove the old impact on the Recipe
        with transaction.atomic():
            recipe = Recipe.objects.select_for_update().get(pk=old_rating.recipe_id)
            if old_rating.taste_rating is not None:
                recipe.drop_rating('taste', old_rating.taste_rating)
            if old_rating.difficulty_rating is not None:
                recipe.drop_rating('difficulty', old_rating.difficulty_rating)

        # 3) Save the new rating values
        new_rating = serializer.save()

        # 4) Atomically apply the new impact on the **same** Recipe row
        with transaction.atomic():
            recipe = Recipe.objects.select_for_update().get(pk=new_rating.recipe_id)
            if new_rating.taste_rating is not None:
                recipe.update_ratings('taste', new_rating.taste_rating)
            if new_rating.difficulty_rating is not None:
                recipe.update_ratings('difficulty', new_rating.difficulty_rating)

    def perform_destroy(self, instance):
        self._remove_old_rating_impact(instance)
        instance.delete()

    def _update_recipe_stats(self, rating):
        recipe = rating.recipe
        if rating.taste_rating is not None:
            recipe.update_ratings('taste', rating.taste_rating)
        if rating.difficulty_rating is not None:
            recipe.update_ratings('difficulty', rating.difficulty_rating)

    def _remove_old_rating_impact(self, rating):
        # 1. Grab a fresh copy of the recipe from the DB
        recipe = rating.recipe
        if rating.taste_rating is not None:
            recipe.drop_rating('taste', rating.taste_rating)
        if rating.difficulty_rating is not None:
            recipe.drop_rating('difficulty', rating.difficulty_rating)
    
    def _apply_recipe_change(self, rating, *, old_taste, new_taste, old_diff, new_diff):
        """
        Re-fetch the Recipe once, then drop old and add new on that same object.
        """
        recipe = Recipe.objects.get(pk=rating.recipe_id)

        # Drop old taste
        if old_taste is not None:
            recipe.drop_rating('taste', old_taste)
        # Drop old difficulty
        if old_diff is not None:
            recipe.drop_rating('difficulty', old_diff)

        # Apply new taste
        if new_taste is not None:
            recipe.update_ratings('taste', new_taste)
        # Apply new difficulty
        if new_diff is not None:
            recipe.update_ratings('difficulty', new_diff)


class IsDietitian(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.usertype == RegisteredUser.DIETITIAN

class HealthRatingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Health Ratings (dietitians only)
    """
    swagger_tags = ['Health Ratings']
    queryset = HealthRating.objects.all()
    serializer_class = HealthRatingSerializer
    permission_classes = [IsDietitian]

    def get_queryset(self):
        # short-circuit schema generation
        if getattr(self, 'swagger_fake_view', False):
            return HealthRating.objects.none()
        return self.queryset.filter(dietitian=self.request.user)

    @swagger_auto_schema(
        operation_summary="List your health ratings",
        tags=["Health Ratings"],
        responses={200: HealthRatingSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Retrieve a single health rating",
        tags=["Health Ratings"],
        responses={200: HealthRatingSerializer()}
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Create a health rating (one per dietitian per recipe)",
        tags=["Health Ratings"],
        request_body=HealthRatingSerializer,
        responses={201: HealthRatingSerializer()}
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Replace an existing health rating",
        tags=["Health Ratings"],
        request_body=HealthRatingSerializer,
        responses={200: HealthRatingSerializer()}
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Partially update a health rating",
        tags=["Health Ratings"],
        request_body=HealthRatingSerializer,
        responses={200: HealthRatingSerializer()}
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Delete a health rating",
        tags=["Health Ratings"],
        responses={204: None}
    )
    def destroy(self, request, *args, **kwargs):

        return super().destroy(request, *args, **kwargs)

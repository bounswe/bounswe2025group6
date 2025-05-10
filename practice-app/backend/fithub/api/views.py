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
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from .models import RegisteredUser, RecipeRating
from recipes.models import Recipe  # Import from recipes app
from rest_framework import serializers

from .serializers import (UserRegistrationSerializer, LoginSerializer, RequestPasswordResetCodeSerializer,
                           VerifyPasswordResetCodeSerializer, ResetPasswordSerializer,PasswordResetToken, RegisteredUserSerializer, RecipeRatingSerializer)

User = get_user_model()


def index(request):
    return HttpResponse("Home page! Work in progress...")

@swagger_auto_schema(
    method='post',
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
    verify_url = f'http://{domain}{link}'

    subject = 'Verify your email'
    message = f'Click the link to verify your account: {verify_url}'
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])


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
    reset_link = f'http://{settings.SITE_DOMAIN}{reset_url}'

    subject = "Fithub Password Reset Request"
    message = f"To reset your password, click the following link: {reset_link}"
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])

    return Response({"detail": "If this email exists, a password reset link has been sent."}, status=status.HTTP_200_OK)

@swagger_auto_schema(
    method='post',
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
        request_body=ResetPasswordSerializer,
        responses={200: "Password reset successful", 400: "Validation error"}
    )
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Password has been successfully reset."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class login_view(APIView):
    @swagger_auto_schema(
        request_body=LoginSerializer(),  # Specify the serializer for login
        responses={
            200: 'Successful login response with token',
            400: 'Bad request',
            401: 'Invalid credentials'
        }
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.id,
                'email': user.email,
                'usertype': user.usertype,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

class RegisteredUserViewSet(viewsets.ModelViewSet):
    queryset = RegisteredUser.objects.all()
    serializer_class = RegisteredUserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Adjust as needed

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
        tags=['User Relationships']
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
    
    #RATE RECIPE SWAGGER
    @swagger_auto_schema(
        operation_description="Submit a rating for a specific recipe",
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

            return Response(RecipeRatingSerializer(rating).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# ViewSet for Recipe Ratings
class RecipeRatingViewSet(viewsets.ModelViewSet):
    queryset = RecipeRating.objects.all()
    serializer_class = RecipeRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Only show ratings for the current user"""
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Handle rating creation and update recipe stats"""
        rating = serializer.save(user=self.request.user)
        self._update_recipe_stats(rating)

    def perform_update(self, serializer):
        """Handle rating update by first removing old rating impact"""
        old_rating = self.get_object()
        recipe = old_rating.recipe
        
        # Remove old rating values from recipe totals
        if old_rating.taste_rating is not None:
            recipe.drop_rating('taste', old_rating.taste_rating)
        if old_rating.difficulty_rating is not None:
            recipe.drop_rating('difficulty', old_rating.difficulty_rating)
        
        # Save the new rating
        new_rating = serializer.save()
        
        # Add new rating values to recipe totals
        if new_rating.taste_rating is not None:
            recipe.update_ratings('taste', new_rating.taste_rating)
        if new_rating.difficulty_rating is not None:
            recipe.update_ratings('difficulty', new_rating.difficulty_rating)

    def perform_destroy(self, instance):
        """Handle rating deletion by removing its impact"""
        recipe = instance.recipe
        if instance.taste_rating is not None:
            recipe.drop_rating('taste', instance.taste_rating)
        if instance.difficulty_rating is not None:
            recipe.drop_rating('difficulty', instance.difficulty_rating)
        instance.delete()
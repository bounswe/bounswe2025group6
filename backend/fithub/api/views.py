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
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated

from .serializers import (UserRegistrationSerializer, LoginSerializer, RequestPasswordResetCodeSerializer,
                           VerifyPasswordResetCodeSerializer, ResetPasswordSerializer,PasswordResetToken)

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
    ['savasciogluozgur@gmail.com'],
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

from django.shortcuts import render, get_object_or_404
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
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.response import Response
from rest_framework import status

from .serializers import UserRegistrationSerializer

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
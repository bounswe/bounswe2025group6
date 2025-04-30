from django.shortcuts import render

from django.http import HttpResponse

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .serializers import UserRegistrationSerializer


def index(request):
    return HttpResponse("Home page! Work in progress...")

@api_view(['POST'])
def register_user(request):
    if request.method == 'POST':
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            # Save to registered_users table
            user = serializer.save()  # This saves the user data into registered_users
            return Response({
                'message': 'User registered successfully.',
                'username': user.username,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
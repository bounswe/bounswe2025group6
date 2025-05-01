# myproject/urls.py
from django.urls import path 
from . import views
from .views import register_user, verify_email

urlpatterns = [
    path('register/', views.register_user, name='register_user'),
    path('verify-email/<uidb64>/<token>/', verify_email, name='email-verify'),
]

# myproject/urls.py
from django.urls import path 
from . import views
from .views import register_user, forgot_password, password_reset, verify_email, login_view, logout_view

urlpatterns = [
    path('register/', views.register_user, name='register_user'),
    path('verify-email/<uidb64>/<token>/', verify_email, name='email-verify'),
    path('forgot-password/', views.forgot_password, name='forgot-password'),
    path('password-reset/<uidb64>/<token>/', views.password_reset, name='password-reset'),
    path('login/', login_view.as_view(), name='login_view'),
    path('logout/', logout_view.as_view(), name='logout_view'),
]

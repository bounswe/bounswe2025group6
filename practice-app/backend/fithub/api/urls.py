# myproject/urls.py
from django.urls import path , include
from . import views
from rest_framework.routers import DefaultRouter
from .views import register_user, forgot_password, password_reset, verify_email, login_view, logout_view, RequestResetCodeView, VerifyResetCodeView, ResetPasswordView
from .views import RegisteredUserViewSet, RecipeRatingViewSet, get_user_id_by_email

# Initialize the router
router = DefaultRouter()
router.register(r'users', RegisteredUserViewSet)
router.register(r'recipe-ratings', RecipeRatingViewSet)


urlpatterns = [
    path('register/', views.register_user, name='register_user'),
    path('verify-email/<uidb64>/<token>/', verify_email, name='email-verify'),
    path('forgot-password/', views.forgot_password, name='forgot-password'),
    path('password-reset/<uidb64>/<token>/', views.password_reset, name='password-reset'),
    path('request-password-reset-code/', RequestResetCodeView.as_view(), name='request-password-reset-code'),
    path('verify-reset-code/', VerifyResetCodeView.as_view(), name='verify-reset-code'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('login/', login_view.as_view(), name='login_view'),
    path('logout/', logout_view.as_view(), name='logout_view'),
    path('get-user-id/', get_user_id_by_email, name='get-user-id'),
    path('', include(router.urls)),
]

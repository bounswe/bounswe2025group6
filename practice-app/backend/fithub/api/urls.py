# myproject/urls.py
from django.urls import path , include
from . import views
from rest_framework.routers import DefaultRouter
from .views import register_user, forgot_password, password_reset, verify_email, login_view, logout_view, RequestResetCodeView, VerifyResetCodeView, ResetPasswordView
from .views import RegisteredUserViewSet, RecipeRatingViewSet, HealthRatingViewSet, get_user_id_by_email
from .views import get_user_recipe_ids, get_user_comment_ids, get_user_post_ids
from .views import get_user_question_ids, get_user_answer_ids, activity_stream

# Initialize the router
router = DefaultRouter()
router.register(r'users', RegisteredUserViewSet)
router.register(r'recipe-ratings', RecipeRatingViewSet)
router.register(r'health-ratings', HealthRatingViewSet, basename='healthrating')



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
    path('users/<int:user_id>/recipe-ids/', get_user_recipe_ids, name='get-user-recipe-ids'),
    path('users/<int:user_id>/comment-ids/', get_user_comment_ids, name='get-user-comment-ids'),
    path('users/<int:user_id>/post-ids/', get_user_post_ids, name='get-user-post-ids'),
    path('users/<int:user_id>/question-ids/', get_user_question_ids, name='get-user-question-ids'),
    path('users/<int:user_id>/answer-ids/', get_user_answer_ids, name='get-user-answer-ids'),
    path('activity-stream/', activity_stream, name='activity-stream'),
    path('', include(router.urls)),
]

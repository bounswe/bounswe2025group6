# recipes/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecipeViewSet
from .views import get_user_recipe_count



router = DefaultRouter()
router.register(r'', RecipeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('user/<int:user_id>/recipe-count/', get_user_recipe_count, name='user-recipe-count'),
]
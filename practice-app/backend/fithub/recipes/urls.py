# recipes/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecipeViewSet, MealPlannerView


router = DefaultRouter()
router.register(r'', RecipeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path("meal_planner/", MealPlannerView.as_view(), name="meal-planner"),
]
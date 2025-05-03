from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecipeViewSet, RecipeLikeViewSet, IngredientViewSet

# Initialize the DefaultRouter, which automatically generates routes for the ViewSets
router = DefaultRouter()
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'recipe_likes', RecipeLikeViewSet, basename='recipe_like')
router.register(r'ingredients', IngredientViewSet, basename='ingredient')

urlpatterns = [
    path('api/', include(router.urls)),
]

# recipes/urls.py

from django.urls import path
from .views import (
    RecipeCreateView,
    RecipeDetailView,
    RecipeUpdateView,
    RecipeDeleteView,
    RecipeListView,
    RecipeAllergensView,
)

urlpatterns = [
    path('recipes/', RecipeCreateView.as_view(), name='create-recipe'),                           # POST
    path('recipes/<int:pk>/', RecipeDetailView.as_view(), name='get-recipe'),                     # GET
    path('recipes/<int:pk>/update/', RecipeUpdateView.as_view(), name='update-recipe'),           # PUT
    path('recipes/<int:pk>/delete/', RecipeDeleteView.as_view(), name='delete-recipe'),           # DELETE
    path('recipes/<int:pk>/allergens/', RecipeAllergensView.as_view(), name='recipe-allergens'),  # GET allergens
    path('recipes/', RecipeListView.as_view(), name='list-recipes'),                              # GET filtered
]

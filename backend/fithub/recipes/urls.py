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
    path('', RecipeCreateView.as_view(), name='create-recipe'),                           # POST
    path('<int:pk>/', RecipeDetailView.as_view(), name='get-recipe'),                     # GET
    path('<int:pk>/update/', RecipeUpdateView.as_view(), name='update-recipe'),           # PUT
    path('<int:pk>/delete/', RecipeDeleteView.as_view(), name='delete-recipe'),           # DELETE
    path('<int:pk>/allergens/', RecipeAllergensView.as_view(), name='recipe-allergens'),  # GET allergens
    path('', RecipeListView.as_view(), name='list-recipes'),                              # GET filtered
]



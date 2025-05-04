# recipes/urls.py

from django.urls import path
from .views import (
    recipe_detail,
    recipes_view,
)

urlpatterns = [
    path('', recipes_view, name='recipes'),
    path('<int:id>/', recipe_detail, name='recipe-detail'),
]

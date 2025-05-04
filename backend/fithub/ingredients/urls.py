# ingredients/urls.py
from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, get_ingredient_id_by_name
from django.urls import path

router = DefaultRouter()
router.register(r'', IngredientViewSet, basename='ingredient')

urlpatterns = [
    # Unpack the list of URLs from the router
    *router.urls,
    # Add the custom endpoint for getting the ingredient ID by name
    path('get-id-by-name/', get_ingredient_id_by_name, name='get_ingredient_id_by_name'),
    ]

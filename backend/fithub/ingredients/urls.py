# ingredients/urls.py
from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet

router = DefaultRouter()
router.register(r'ingredients', IngredientViewSet, basename='ingredient')

urlpatterns = router.urls

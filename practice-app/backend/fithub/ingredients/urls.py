# ingredients/urls.py
from rest_framework.routers import DefaultRouter
from .views import IngredientViewSet, WikidataViewSet

router = DefaultRouter()
router.register(r'', IngredientViewSet, basename='ingredient')
router.register(r'wikidata', WikidataViewSet, basename='wikidata')

urlpatterns = router.urls

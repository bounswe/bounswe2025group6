# recipes/serializers.py
from pyexpat import model
from rest_framework import serializers
from .models import Ingredient, WikidataInfo
from rest_framework.pagination import PageNumberPagination  

class IngredientSerializer(serializers.ModelSerializer):
    prices = serializers.SerializerMethodField()

    class Meta:
        model = Ingredient
        fields = [
            "id",
            "name",
            "category",
            "allergens",
            "dietary_info",
            "prices",
        ]

    def get_prices(self, obj: Ingredient):
        """Return prices converted based on the user's preferred currency."""
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # fallback for anonymous users (USD default)
        if not user or not user.is_authenticated:
            class DummyUser:
                preferredCurrency = "USD"
            user = DummyUser()

        return obj.get_prices_for_user(user)
    
# Needed for pagination
class IngredientPagination(PageNumberPagination):
    page_size = 10  # Number of items per page
    page_size_query_param = 'page_size'  # Allow clients to specify a page size
    max_page_size = 100  # Maximum page size the client can request

#Wikidata Info Serializer
# This serializer is used to serialize the WikidataInfo model
# which contains additional information about the ingredient from Wikidata.
# It includes fields like wikidata_id, wikidata_label, etc.
class WikidataInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = WikidataInfo
        fields = '__all__'
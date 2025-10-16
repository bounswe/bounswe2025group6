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
            "base_unit",
            "base_quantity",
            "allowed_units",
            "prices",
        ]

    def get_prices(self, obj: Ingredient):
        """
        Return prices converted based on the user's preferred currency.
        Uses a quantity of 1 * base_quantity by default.
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated:
            class DummyUser:
                preferredCurrency = "USD"
            user = DummyUser()

        quantity = self.context.get("quantity", obj.base_quantity)
        unit = self.context.get("unit", obj.base_unit)

        return obj.get_price_for_user(user, quantity=quantity, unit=unit)

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
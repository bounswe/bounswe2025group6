# recipes/serializers.py
from pyexpat import model
from rest_framework import serializers
from .models import Ingredient, WikidataInfo
from rest_framework.pagination import PageNumberPagination  
import math
from rest_framework.response import Response

class IngredientSerializer(serializers.ModelSerializer):
    prices = serializers.SerializerMethodField()

    class Meta:
        model = Ingredient
        fields = [
            "id",
            "created_at",
            "updated_at",
            "deleted_on",
            "name",
            "category",
            "allergens",
            "dietary_info",
            "base_unit",
            "base_quantity",
            "allowed_units",
            "prices",
            "nutrition_info"
        ]

    def get_nutrition_info(self, obj: Ingredient):
        request = self.context.get("request")
        
        quantity = self.context.get("quantity", obj.base_quantity)
        unit = self.context.get("unit", obj.base_unit)

        return obj.get_nutrion_info(quantity=quantity, unit=unit)
    
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

class IngredientPagination(PageNumberPagination):
    page_size = 10  # Default items per page
    page_size_query_param = 'page_size'  # Let clients override page size
    max_page_size = 100  # Max allowed page size

    def get_paginated_response(self, data):
        page_size = self.get_page_size(self.request)
        total_count = self.page.paginator.count
        total_pages = math.ceil(total_count / page_size) if page_size else 1

        return Response({
            'page': self.page.number,
            'page_size': page_size,
            'count': total_count,
            'total_pages': total_pages,
            'results': data,
        })
    
#Wikidata Info Serializer
# This serializer is used to serialize the WikidataInfo model
# which contains additional information about the ingredient from Wikidata.
# It includes fields like wikidata_id, wikidata_label, etc.
class WikidataInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = WikidataInfo
        fields = '__all__'
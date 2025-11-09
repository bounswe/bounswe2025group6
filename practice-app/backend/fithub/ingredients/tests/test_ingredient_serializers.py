from django.test import TestCase
from ingredients.models import Ingredient, WikidataInfo
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from decimal import Decimal
import json
from unittest.mock import patch, Mock, MagicMock
from rest_framework.test import APIClient, APITestCase
from django.urls import reverse
from django.core.cache import cache
from rest_framework import status

"""Serializer Tests"""

class IngredientSerializerTests(TestCase):
    """Tests for IngredientSerializer"""

    def setUp(self):
        """Set up test fixtures"""
        self.ingredient = Ingredient.objects.create(
            name="Test Ingredient",
            category="other",
            base_unit="g",
            base_quantity=Decimal("100.0"),
            calories=Decimal("50.0"),
            protein=Decimal("5.0"),
            fat=Decimal("2.0"),
            carbs=Decimal("10.0"),
            price_A101=Decimal("2.50"),
            price_SOK=Decimal("2.60"),
            allergens=["gluten"],
            dietary_info=["vegan"],
            allowed_units=["g", "kg"]
        )

    def test_ingredient_serializer_basic_fields(self):
        """
        Test that IngredientSerializer includes all basic fields.
        """
        from ingredients.serializers import IngredientSerializer
        
        serializer = IngredientSerializer(self.ingredient)
        data = serializer.data
        
        self.assertEqual(data["name"], "Test Ingredient")
        self.assertEqual(data["category"], "other")
        self.assertEqual(data["base_unit"], "g")
        self.assertEqual(data["base_quantity"], "100.00")
        self.assertEqual(data["allergens"], ["gluten"])
        self.assertEqual(data["dietary_info"], ["vegan"])
        self.assertEqual(data["allowed_units"], ["g", "kg"])

    def test_ingredient_serializer_nutrition_info(self):
        """
        Test that IngredientSerializer includes nutrition_info.
        """
        from ingredients.serializers import IngredientSerializer
        
        serializer = IngredientSerializer(self.ingredient)
        data = serializer.data
        
        self.assertIn("nutrition_info", data)
        self.assertEqual(data["nutrition_info"]["calories"], Decimal("50.0"))
        self.assertEqual(data["nutrition_info"]["protein"], Decimal("5.0"))
        self.assertEqual(data["nutrition_info"]["fat"], Decimal("2.0"))
        self.assertEqual(data["nutrition_info"]["carbs"], Decimal("10.0"))

    def test_ingredient_serializer_nutrition_info_custom_quantity(self):
        """
        Test that IngredientSerializer nutrition_info respects custom quantity.
        """
        from ingredients.serializers import IngredientSerializer
        
        serializer = IngredientSerializer(
            self.ingredient,
            context={"quantity": Decimal("200.0"), "unit": "g"}
        )
        data = serializer.data
        
        # 200g = 2x base quantity (100g), so nutrition should be doubled
        self.assertEqual(data["nutrition_info"]["calories"], Decimal("100.0"))
        self.assertEqual(data["nutrition_info"]["protein"], Decimal("10.0"))

    def test_ingredient_serializer_prices(self):
        """
        Test that IngredientSerializer includes prices.
        """
        from ingredients.serializers import IngredientSerializer
        from unittest.mock import Mock
        
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = True
        request.user.preferredCurrency = "USD"
        
        serializer = IngredientSerializer(
            self.ingredient,
            context={"request": request}
        )
        data = serializer.data
        
        self.assertIn("prices", data)
        self.assertEqual(data["prices"]["currency"], "USD")
        self.assertIn("A101", data["prices"])
        self.assertIn("SOK", data["prices"])
        self.assertIn("BIM", data["prices"])
        self.assertIn("MIGROS", data["prices"])

    def test_ingredient_serializer_prices_unauthenticated(self):
        """
        Test that IngredientSerializer uses dummy USD user when unauthenticated.
        """
        from ingredients.serializers import IngredientSerializer
        from unittest.mock import Mock
        
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = False
        
        serializer = IngredientSerializer(
            self.ingredient,
            context={"request": request}
        )
        data = serializer.data
        
        self.assertIn("prices", data)
        self.assertEqual(data["prices"]["currency"], "USD")

    def test_ingredient_serializer_prices_custom_quantity(self):
        """
        Test that IngredientSerializer prices respect custom quantity.
        """
        from ingredients.serializers import IngredientSerializer
        from unittest.mock import Mock
        
        request = Mock()
        request.user = Mock()
        request.user.is_authenticated = True
        request.user.preferredCurrency = "USD"
        
        serializer = IngredientSerializer(
            self.ingredient,
            context={
                "request": request,
                "quantity": Decimal("200.0"),
                "unit": "g"
            }
        )
        data = serializer.data
        
        # 200g = 2x base quantity (100g), so prices should be doubled
        self.assertEqual(data["prices"]["A101"], Decimal("5.00"))

class WikidataInfoSerializerTests(TestCase):
    """Tests for WikidataInfoSerializer"""

    def setUp(self):
        """Set up test fixtures"""
        self.ingredient = Ingredient.objects.create(name="Apple", category="fruits")
        self.wikidata_info = WikidataInfo.objects.create(
            ingredient_id=self.ingredient.id,
            wikidata_id="Q89",
            wikidata_label="Apple",
            wikidata_description="Edible fruit",
            wikidata_image_url="https://example.com/apple.jpg",
            is_vegan=True,
            origin="Central Asia",
            category="Fruit",
            allergens=["None"],
            nutrition={"calories": 52, "protein": 0.3}
        )

    def test_wikidata_info_serializer_all_fields(self):
        """
        Test that WikidataInfoSerializer includes all fields.
        """
        from ingredients.serializers import WikidataInfoSerializer
        
        serializer = WikidataInfoSerializer(self.wikidata_info)
        data = serializer.data
        
        self.assertEqual(data["ingredient_id"], self.ingredient.id)
        self.assertEqual(data["wikidata_id"], "Q89")
        self.assertEqual(data["wikidata_label"], "Apple")
        self.assertEqual(data["wikidata_description"], "Edible fruit")
        self.assertEqual(data["is_vegan"], True)
        self.assertEqual(data["origin"], "Central Asia")
        self.assertEqual(data["category"], "Fruit")
        self.assertEqual(data["allergens"], ["None"])
        self.assertEqual(data["nutrition"], {"calories": 52, "protein": 0.3})

class IngredientPaginationTests(APITestCase):
    """Tests for IngredientPagination"""

    def setUp(self):
        """Set up test fixtures"""
        self.client = APIClient()
        # Create 15 ingredients to test pagination
        for i in range(15):
            Ingredient.objects.create(
                name=f"Ingredient {i}",
                category="other",
                base_unit="pcs",
                base_quantity=Decimal("1.0")
            )

    def test_pagination_default_page_size(self):
        """
        Test that pagination uses default page size of 10.
        """
        url = reverse("ingredient-list")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 10)
        self.assertEqual(response.data["count"], 15)
        self.assertEqual(response.data["total_pages"], 2)

    def test_pagination_custom_page_size(self):
        """
        Test that pagination respects custom page_size parameter.
        """
        url = reverse("ingredient-list")
        response = self.client.get(url, {"page_size": 5})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 5)
        self.assertEqual(response.data["page_size"], 5)
        self.assertEqual(response.data["total_pages"], 3)

    def test_pagination_max_page_size(self):
        """
        Test that pagination respects max_page_size limit.
        """
        url = reverse("ingredient-list")
        response = self.client.get(url, {"page_size": 200})  # Exceeds max of 100
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["page_size"], 100)  # Should be capped at 100

    def test_pagination_page_number(self):
        """
        Test that pagination works with page parameter.
        """
        url = reverse("ingredient-list")
        response = self.client.get(url, {"page": 2, "page_size": 10})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["page"], 2)
        self.assertEqual(len(response.data["results"]), 5)  # 15 total - 10 on first page = 5 on second


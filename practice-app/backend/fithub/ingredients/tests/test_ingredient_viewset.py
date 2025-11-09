from django.test import TestCase
from ingredients.models  import Ingredient, WikidataInfo
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from decimal import Decimal
import json
from unittest.mock import patch, Mock, MagicMock
from rest_framework.test import APIClient, APITestCase
from django.urls import reverse
from django.core.cache import cache
from rest_framework import status

"""API Tests for IngredientViewSet"""

class IngredientViewSetTests(APITestCase):
    """Tests for IngredientViewSet API endpoints"""

    def setUp(self):
        """Set up test fixtures"""
        self.client = APIClient()
        self.ingredient1 = Ingredient.objects.create(
            name="Apple",
            category="fruits",
            base_unit="pcs",
            base_quantity=Decimal("1.0")
        )
        self.ingredient2 = Ingredient.objects.create(
            name="Banana",
            category="fruits",
            base_unit="pcs",
            base_quantity=Decimal("1.0")
        )
        self.ingredient3 = Ingredient.objects.create(
            name="Chicken",
            category="proteins",
            base_unit="g",
            base_quantity=Decimal("100.0")
        )

    def test_list_ingredients(self):
        """
        Test listing all ingredients.
        """
        url = reverse("ingredient-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 3)

    def test_list_ingredients_pagination(self):
        """
        Test pagination in ingredient list.
        """
        url = reverse("ingredient-list")
        response = self.client.get(url, {"page_size": 2})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)
        self.assertIn("page", response.data)
        self.assertIn("total_pages", response.data)
        self.assertIn("count", response.data)

    def test_retrieve_ingredient(self):
        """
        Test retrieving a specific ingredient.
        """
        url = reverse("ingredient-detail", kwargs={"pk": self.ingredient1.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Apple")
        self.assertEqual(response.data["id"], self.ingredient1.pk)

    def test_retrieve_nonexistent_ingredient(self):
        """
        Test retrieving a nonexistent ingredient returns 404.
        """
        url = reverse("ingredient-detail", kwargs={"pk": 99999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_ingredient_by_name_success(self):
        """
        Test getting ingredient by name successfully.
        """
        url = reverse("ingredient-get-ingredient-by-name")
        response = self.client.get(url, {"name": "Apple"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Apple")
        self.assertEqual(response.data["id"], self.ingredient1.pk)

    def test_get_ingredient_by_name_not_found(self):
        """
        Test getting ingredient by name when not found.
        """
        url = reverse("ingredient-get-ingredient-by-name")
        response = self.client.get(url, {"name": "Nonexistent"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_get_ingredient_by_name_missing_parameter(self):
        """
        Test getting ingredient by name without name parameter.
        """
        url = reverse("ingredient-get-ingredient-by-name")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_get_ingredient_by_name_normalizes_whitespace(self):
        """
        Test that get_ingredient_by_name normalizes whitespace.
        """
        url = reverse("ingredient-get-ingredient-by-name")
        response = self.client.get(url, {"name": "  Apple  "})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Apple")

    def test_get_id_by_name_success(self):
        """
        Test getting ingredient ID by name successfully.
        """
        url = reverse("ingredient-get-id-by-name")
        response = self.client.get(url, {"name": "Banana"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.ingredient2.pk)

    def test_get_id_by_name_not_found(self):
        """
        Test getting ingredient ID by name when not found.
        """
        url = reverse("ingredient-get-id-by-name")
        response = self.client.get(url, {"name": "Nonexistent"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_get_id_by_name_missing_parameter(self):
        """
        Test getting ingredient ID by name without name parameter.
        """
        url = reverse("ingredient-get-id-by-name")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)


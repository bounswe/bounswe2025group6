from django.test import TestCase
from .models import Ingredient
from django.core.exceptions import ValidationError

import json
from unittest.mock import patch, Mock
from rest_framework.test import APIClient
from django.urls import reverse
from django.core.cache import cache

"""Tests for the Ingredient model"""

class IngredientModelTests(TestCase):

    def test_create_ingredient_with_default_category(self):
        """
        Test that when an ingredient is created without specifying a category,
        the default value 'other' is used.
        """
        ingredient = Ingredient.objects.create(name="Sugar")
        self.assertEqual(ingredient.category, "other")

    def test_create_ingredient_with_valid_category(self):
        """
        Test that an ingredient can be created with a valid category.
        """
        ingredient = Ingredient.objects.create(
            name="Chicken",
            category="proteins"  # proteins is a valid category
        )
        self.assertEqual(ingredient.category, "proteins")


    def test_create_ingredient_with_invalid_category(self):
        """
        Test that an invalid category raises a validation error.
        """

        ingredient = Ingredient(
            name="Invalid Ingredient",
            category="invalid_category"
        )

        # Check that full_clean raises a ValidationError
        with self.assertRaises(ValidationError):
            ingredient.full_clean()

    def test_create_ingredient_with_empty_allergens_and_dietary_info(self):
        """
        Test that allergens and dietary_info can be empty (empty list).
        """
        ingredient = Ingredient.objects.create(
            name="Salt",
            category="herbs_and_spices",
            allergens=[],  # Empty list
            dietary_info=[]  # Empty list
        )
        self.assertEqual(ingredient.allergens, [])
        self.assertEqual(ingredient.dietary_info, [])


    def test_str_method(self):
        """
        Test the __str__ method of the Ingredient model.
        """
        ingredient = Ingredient.objects.create(name="Tomato", category="vegetables")
        self.assertEqual(str(ingredient), "Tomato")


# WIKIDATA API CONNECTION TO INGREDIENTS TESTS

class ForcefulWikidataMockingTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.apple = Ingredient.objects.create(name="Apple", category="fruits")
        cache.clear()  # Clear cache before each test

    def test_forceful_wikidata_id_mocking_apple(self):
        with patch("ingredients.views.get_wikidata_id", return_value="FORCED_Q89"):
            with patch("wikidata.utils.get_wikidata_details", return_value={
                "labels": {"en": {"value": "Apple"}},
                "descriptions": {"en": {"value": "Edible fruit"}},
                "claims": {},
            }):
                url = reverse("ingredient-detail", kwargs={"pk": self.apple.pk})
                response = self.client.get(url)
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertEqual(data.get("wikidata_id"), "FORCED_Q89")
                self.assertEqual(data.get("name"), "Apple")

class ForcefulWikidataMockingTestBanana(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.banana = Ingredient.objects.create(name="Banana", category="fruits")
        cache.clear()  # Clear cache before each test
    
    def test_forceful_wikidata_id_mocking_banana(self):
        with patch("ingredients.views.get_wikidata_id", return_value="FORCED_Q217"):
            with patch("wikidata.utils.get_wikidata_details", return_value={
                "labels": {"en": {"value": "Banana"}},
                "descriptions": {"en": {"value": "Tropical fruit"}},
                "claims": {},
            }):
                url = reverse("ingredient-detail", kwargs={"pk": self.banana.pk})
                response = self.client.get(url)
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertEqual(data.get("wikidata_id"), "FORCED_Q217")
                self.assertEqual(data.get("name"), "Banana")
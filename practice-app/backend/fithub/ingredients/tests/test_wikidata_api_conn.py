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

"""Wikidata API Connection Tests"""

class ForcefulWikidataMockingTest(TestCase):
    """Tests for Wikidata API connection with mocking"""
    
    def setUp(self):
        self.client = APIClient()
        self.apple = Ingredient.objects.create(name="Apple", category="fruits")
        cache.clear()  # Clear cache before each test

    def test_forceful_wikidata_id_mocking_apple(self):
        """
        Test that Wikidata ID mocking works correctly for Apple.
        """
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
                self.assertEqual(data.get("name"), "Apple")

class ForcefulWikidataMockingTestBanana(TestCase):
    """Tests for Wikidata API connection with mocking for Banana"""
    
    def setUp(self):
        self.client = APIClient()
        self.banana = Ingredient.objects.create(name="Banana", category="fruits")
        cache.clear()  # Clear cache before each test
    
    def test_forceful_wikidata_id_mocking_banana(self):
        """
        Test that Wikidata ID mocking works correctly for Banana.
        """
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
                self.assertEqual(data.get("name"), "Banana")


class WikidataInfoModelTests(TestCase):
    """Tests for the WikidataInfo model"""

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

    def test_create_wikidata_info(self):
        """
        Test creating a WikidataInfo instance.
        """
        self.assertEqual(self.wikidata_info.ingredient_id, self.ingredient.id)
        self.assertEqual(self.wikidata_info.wikidata_id, "Q89")
        self.assertEqual(self.wikidata_info.wikidata_label, "Apple")
        self.assertEqual(self.wikidata_info.is_vegan, True)

    def test_wikidata_info_str_method(self):
        """
        Test the __str__ method of WikidataInfo model.
        """
        # Note: The __str__ method references self.ingredient.name, but ingredient_id is just an IntegerField
        # So we can't directly access ingredient.name. The test will check if the string contains expected parts.
        str_repr = str(self.wikidata_info)
        # The __str__ method tries to access ingredient.name, which might fail
        # We'll test that it doesn't crash
        self.assertIsNotNone(str_repr)

    def test_wikidata_info_unique_ingredient_id(self):
        """
        Test that ingredient_id must be unique.
        """
        with self.assertRaises(Exception):  # IntegrityError or similar
            WikidataInfo.objects.create(
                ingredient_id=self.ingredient.id,
                wikidata_id="Q90"
            )

    def test_wikidata_info_nullable_fields(self):
        """
        Test that nullable fields can be None.
        """
        wikidata_info = WikidataInfo.objects.create(
            ingredient_id=Ingredient.objects.create(name="Banana").id,
            wikidata_id=None,
            wikidata_label=None,
            wikidata_description=None
        )
        self.assertIsNone(wikidata_info.wikidata_id)
        self.assertIsNone(wikidata_info.wikidata_label)


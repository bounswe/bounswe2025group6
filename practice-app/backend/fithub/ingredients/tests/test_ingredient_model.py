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

User = get_user_model()

"""Tests for the Ingredient model"""

class IngredientModelTests(TestCase):

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
            price_BIM=Decimal("2.40"),
            price_MIGROS=Decimal("2.70"),
        )

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

    def test_clean_with_valid_allowed_units(self):
        """
        Test that clean() passes when allowed_units are valid.
        """
        ingredient = Ingredient(
            name="Flour",
            base_unit="g",
            allowed_units=["g", "kg", "cup"]
        )
        # Should not raise an error
        try:
            ingredient.clean()
        except ValidationError:
            self.fail("clean() raised ValidationError unexpectedly!")

    def test_clean_with_invalid_allowed_units(self):
        """
        Test that clean() raises ValidationError when allowed_units contain invalid units.
        """
        ingredient = Ingredient(
            name="Flour",
            base_unit="g",
            allowed_units=["g", "invalid_unit", "kg"]
        )
        with self.assertRaises(ValidationError) as context:
            ingredient.clean()
        self.assertIn("Invalid units", str(context.exception))

    def test_clean_with_base_unit_not_in_allowed_units(self):
        """
        Test that clean() raises ValidationError when base_unit is not in allowed_units.
        """
        ingredient = Ingredient(
            name="Flour",
            base_unit="g",
            allowed_units=["kg", "cup"]
        )
        with self.assertRaises(ValidationError) as context:
            ingredient.clean()
        self.assertIn("Base unit must be included in allowed_units", str(context.exception))

    def test_clean_with_empty_allowed_units(self):
        """
        Test that clean() passes when allowed_units is empty.
        """
        ingredient = Ingredient(
            name="Flour",
            base_unit="g",
            allowed_units=[]
        )
        # Should not raise an error
        try:
            ingredient.clean()
        except ValidationError:
            self.fail("clean() raised ValidationError unexpectedly!")

    def test_convert_quantity_to_base_same_unit(self):
        """
        Test convert_quantity_to_base when unit is the same as base_unit.
        """
        result = self.ingredient.convert_quantity_to_base(Decimal("200.0"), "g")
        self.assertEqual(result, Decimal("200.0"))

    def test_convert_quantity_to_base_direct_conversion(self):
        """
        Test convert_quantity_to_base with direct conversion (kg to g).
        """
        ingredient = Ingredient.objects.create(
            name="Flour",
            base_unit="g",
            base_quantity=Decimal("1000.0")
        )
        result = ingredient.convert_quantity_to_base(Decimal("2.0"), "kg")
        self.assertEqual(result, Decimal("2000.0"))

    def test_convert_quantity_to_base_reverse_conversion(self):
        """
        Test convert_quantity_to_base with reverse conversion (ml to l).
        """
        ingredient = Ingredient.objects.create(
            name="Milk",
            base_unit="l",
            base_quantity=Decimal("1.0")
        )
        result = ingredient.convert_quantity_to_base(Decimal("500.0"), "ml")
        self.assertEqual(result, Decimal("0.5"))

    def test_convert_quantity_to_base_invalid_conversion(self):
        """
        Test convert_quantity_to_base raises ValidationError for invalid conversion.
        """
        ingredient = Ingredient.objects.create(
            name="Test",
            base_unit="g",
            base_quantity=Decimal("100.0")
        )
        with self.assertRaises(ValidationError) as context:
            ingredient.convert_quantity_to_base(Decimal("1.0"), "invalid_unit")
        self.assertIn("Cannot convert", str(context.exception))

    def test_get_base_price(self):
        """
        Test get_base_price returns correct price for a market.
        """
        price = self.ingredient.get_base_price("A101")
        self.assertEqual(price, Decimal("2.50"))
        
        price = self.ingredient.get_base_price("SOK")
        self.assertEqual(price, Decimal("2.60"))

    def test_get_base_price_nonexistent_market(self):
        """
        Test get_base_price returns None for nonexistent market.
        """
        price = self.ingredient.get_base_price("NONEXISTENT")
        self.assertIsNone(price)

    def test_get_nutrion_info_default_quantity(self):
        """
        Test get_nutrion_info with base_quantity.
        """
        result = self.ingredient.get_nutrion_info(quantity=self.ingredient.base_quantity, unit=self.ingredient.base_unit)
        self.assertEqual(result["calories"], Decimal("50.0"))
        self.assertEqual(result["protein"], Decimal("5.0"))
        self.assertEqual(result["fat"], Decimal("2.0"))
        self.assertEqual(result["carbs"], Decimal("10.0"))

    def test_get_nutrion_info_custom_quantity(self):
        """
        Test get_nutrion_info with custom quantity.
        """
        result = self.ingredient.get_nutrion_info(quantity=Decimal("200.0"), unit="g")
        self.assertEqual(result["calories"], Decimal("100.0"))
        self.assertEqual(result["protein"], Decimal("10.0"))
        self.assertEqual(result["fat"], Decimal("4.0"))
        self.assertEqual(result["carbs"], Decimal("20.0"))

    def test_get_nutrion_info_with_unit_conversion(self):
        """
        Test get_nutrion_info with unit conversion (kg to g).
        """
        result = self.ingredient.get_nutrion_info(quantity=Decimal("1.0"), unit="kg")
        # 1 kg = 1000 g, so nutrition should be 10x the base (100g)
        self.assertEqual(result["calories"], Decimal("500.0"))
        self.assertEqual(result["protein"], Decimal("50.0"))

    def test_get_nutrion_info_with_none_values(self):
        """
        Test get_nutrion_info handles None values correctly.
        """
        ingredient = Ingredient.objects.create(
            name="Water",
            base_unit="ml",
            base_quantity=Decimal("100.0"),
            calories=None,
            protein=None
        )
        result = ingredient.get_nutrion_info()
        self.assertIsNone(result["calories"])
        self.assertIsNone(result["protein"])

    def test_get_price_for_user_usd_to_usd(self):
        """
        Test get_price_for_user with USD base currency and USD user currency.
        """
        user = Mock()
        user.preferredCurrency = "USD"
        
        result = self.ingredient.get_price_for_user(user, quantity=Decimal("200.0"), unit="g")
        
        # 200g = 2x base quantity (100g), so prices should be doubled
        self.assertEqual(result["currency"], "USD")
        self.assertEqual(result["A101"], Decimal("5.00"))
        self.assertEqual(result["SOK"], Decimal("5.20"))
        self.assertEqual(result["BIM"], Decimal("4.80"))
        self.assertEqual(result["MIGROS"], Decimal("5.40"))

    def test_get_price_for_user_usd_to_try(self):
        """
        Test get_price_for_user with USD base currency and TRY user currency.
        """
        user = Mock()
        user.preferredCurrency = "TRY"
        
        result = self.ingredient.get_price_for_user(
            user, 
            quantity=Decimal("100.0"), 
            unit="g",
            usd_to_try_rate=Decimal("40.0")
        )
        
        # 100g = 1x base quantity, so prices should be multiplied by 40
        self.assertEqual(result["currency"], "TRY")
        self.assertEqual(result["A101"], Decimal("100.00"))
        self.assertEqual(result["SOK"], Decimal("104.00"))
        self.assertEqual(result["BIM"], Decimal("96.00"))
        self.assertEqual(result["MIGROS"], Decimal("108.00"))

    def test_get_price_for_user_try_to_usd(self):
        """
        Test get_price_for_user with TRY base currency and USD user currency.
        """
        ingredient = Ingredient.objects.create(
            name="Turkish Product",
            base_unit="g",
            base_quantity=Decimal("100.0"),
            base_currency="TRY",
            price_A101=Decimal("100.0")
        )
        
        user = Mock()
        user.preferredCurrency = "USD"
        
        result = ingredient.get_price_for_user(
            user,
            quantity=Decimal("100.0"),
            unit="g",
            usd_to_try_rate=Decimal("40.0")
        )
        
        # 100 TRY / 40 = 2.5 USD
        self.assertEqual(result["currency"], "USD")
        self.assertEqual(result["A101"], Decimal("2.50"))

    def test_get_price_for_user_with_none_prices(self):
        """
        Test get_price_for_user handles None prices correctly.
        """
        ingredient = Ingredient.objects.create(
            name="Free Item",
            base_unit="pcs",
            base_quantity=Decimal("1.0"),
            price_A101=None
        )
        
        user = Mock()
        user.preferredCurrency = "USD"
        
        result = ingredient.get_price_for_user(user)
        self.assertIsNone(result["A101"])

    def test_get_price_for_user_with_unit_conversion(self):
        """
        Test get_price_for_user with unit conversion.
        """
        user = Mock()
        user.preferredCurrency = "USD"
        
        # 1 kg = 1000 g = 10x base quantity (100g)
        result = self.ingredient.get_price_for_user(
            user,
            quantity=Decimal("1.0"),
            unit="kg"
        )
        
        self.assertEqual(result["A101"], Decimal("25.00"))  # 2.50 * 10
        self.assertEqual(result["SOK"], Decimal("26.00"))   # 2.60 * 10

    def test_get_price_for_user_unauthenticated_dummy_user(self):
        """
        Test get_price_for_user with unauthenticated user (should use dummy USD user).
        """
        user = Mock()
        user.is_authenticated = False
        user.preferredCurrency = "TRY"
        
        # When user is not authenticated, serializer should use dummy USD user
        # But in model method, we just use the user passed
        result = self.ingredient.get_price_for_user(user)
        self.assertEqual(result["currency"], "TRY")


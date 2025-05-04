from django.test import TestCase
from .models import Ingredient

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

        ingredient =Ingredient.objects.create(
            name="Invalid Ingredient",
            category="invalid_category"  # Invalid category not in CATEGORY_CHOICES
        )

        # first full clean and check for validation error
        with self.assertRaises(ValueError):
            ingredient.full_clean()

    def test_create_ingredient_with_nullable_allergens_and_dietary_info(self):
        """
        Test that allergens and dietary_info fields can be nullable.
        """
        ingredient = Ingredient.objects.create(
            name="Olive Oil",
            category="oils_and_fats",
            allergens=None,
            dietary_info=None
        )
        self.assertIsNone(ingredient.allergens)
        self.assertIsNone(ingredient.dietary_info)

    def test_create_ingredient_with_empty_allergens_and_dietary_info(self):
        """
        Test that allergens and dietary_info can be empty (empty list).
        """
        ingredient = Ingredient.objects.create(
            name="Salt",
            category="herbs_and_spices",
            allergens=[],
            dietary_info=[]
        )
        self.assertEqual(ingredient.allergens, [])
        self.assertEqual(ingredient.dietary_info, [])

    def test_str_method(self):
        """
        Test the __str__ method of the Ingredient model.
        """
        ingredient = Ingredient.objects.create(name="Tomato", category="vegetables")
        self.assertEqual(str(ingredient), "Tomato")

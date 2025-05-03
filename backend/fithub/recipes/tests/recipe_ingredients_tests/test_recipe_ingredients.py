from django.test import TestCase
from django.core.exceptions import ValidationError
from recipes.models import Recipe, Ingredient, RecipeIngredient
from datetime import timedelta

class RecipeIngredientModelTests(TestCase):

    def setUp(self):
        """
        Set up the ingredients and recipe needed for the tests.
        """
        # Create an ingredient instance
        self.ingredient = Ingredient.objects.create(
            name="Sugar",
            category="sweeteners"
        )

        # Create a recipe instance
        self.recipe = Recipe.objects.create(
            name="Sugar Cake",
            steps=["Mix ingredients", "Bake for 30 minutes"],
            prep_time=10,
            cook_time=30,
            meal_type="dinner",
            creator=self.user
        )

    def test_create_valid_recipe_ingredient(self):
        """
        Test that a valid RecipeIngredient can be created successfully.
        """
        # Create a valid RecipeIngredient
        recipe_ingredient = RecipeIngredient.objects.create(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=100.0,
            unit="g"
        )

        # Check that the RecipeIngredient is correctly created
        self.assertEqual(recipe_ingredient.ingredient.name, "Sugar")
        self.assertEqual(recipe_ingredient.recipe.name, "Sugar Cake")
        self.assertEqual(recipe_ingredient.quantity, 100.0)
        self.assertEqual(recipe_ingredient.unit, "g")
        self.assertIsNotNone(recipe_ingredient.created_at)  # Check that the timestamp was set

    def test_create_recipe_ingredient_without_ingredient(self):
        """
        Test that creating a RecipeIngredient without an ingredient raises an error.
        """
        with self.assertRaises(ValidationError):
            recipe_ingredient = RecipeIngredient.objects.create(
                recipe=self.recipe,
                quantity=100.0,
                unit="g"
            )

    def test_create_recipe_ingredient_without_recipe(self):
        """
        Test that creating a RecipeIngredient without a recipe raises an error.
        """
        with self.assertRaises(ValidationError):
            recipe_ingredient = RecipeIngredient.objects.create(
                ingredient=self.ingredient,
                quantity=100.0,
                unit="g"
            )

    def test_create_recipe_ingredient_with_negative_quantity(self):
        """
        Test that creating a RecipeIngredient with a negative quantity raises an error.
        """
        with self.assertRaises(ValidationError):
            recipe_ingredient = RecipeIngredient.objects.create(
                ingredient=self.ingredient,
                recipe=self.recipe,
                quantity=-50.0,  # Invalid negative quantity
                unit="g"
            )

    def test_create_recipe_ingredient_with_long_unit(self):
        """
        Test that creating a RecipeIngredient with a unit longer than the maximum length raises an error.
        """
        # Use a unit that exceeds the max_length of 20
        long_unit = "gramsgramsgramsgrams"

        with self.assertRaises(ValidationError):
            recipe_ingredient = RecipeIngredient.objects.create(
                ingredient=self.ingredient,
                recipe=self.recipe,
                quantity=100.0,
                unit=long_unit  # This unit is too long
            )

    def test_str_method(self):
        """
        Test that the __str__ method returns the correct string representation.
        """
        # Create a RecipeIngredient
        recipe_ingredient = RecipeIngredient.objects.create(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=100.0,
            unit="g"
        )

        # Check the string representation
        self.assertEqual(str(recipe_ingredient), "100.0 g Sugar")

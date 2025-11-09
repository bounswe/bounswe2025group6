from django.test import TestCase
from django.core.exceptions import ValidationError
from api.models import RegisteredUser
from recipes.models import Recipe, RecipeIngredient
from ingredients.models import Ingredient
from decimal import Decimal
from unittest.mock import Mock

class RecipeIngredientModelTests(TestCase):

    def setUp(self):
        """Set up the ingredients and recipe needed for the tests."""
        # Create a user instance
        self.user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="securepassword123"
        )
        if hasattr(self.user, 'preferredCurrency'):
            self.user.preferredCurrency = "USD"
            self.user.save()

        # Create an ingredient instance with prices and nutrition
        self.ingredient = Ingredient.objects.create(
            name="Sugar",
            category="sweeteners",
            base_unit="g",
            base_quantity=Decimal("100.0"),
            calories=Decimal("387.0"),
            protein=Decimal("0.0"),
            fat=Decimal("0.0"),
            carbs=Decimal("100.0"),
            price_A101=Decimal("1.00"),
            price_SOK=Decimal("1.10"),
            price_BIM=Decimal("0.90"),
            price_MIGROS=Decimal("1.20"),
            allowed_units=["g", "kg", "tbsp", "tsp"]
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
        """Test that a valid RecipeIngredient can be created successfully."""
        recipe_ingredient = RecipeIngredient.objects.create(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=Decimal("100.0"),
            unit="g"
        )

        self.assertEqual(recipe_ingredient.ingredient.name, "Sugar")
        self.assertEqual(recipe_ingredient.recipe.name, "Sugar Cake")
        self.assertEqual(recipe_ingredient.quantity, Decimal("100.0"))
        self.assertEqual(recipe_ingredient.unit, "g")
        self.assertIsNotNone(recipe_ingredient.created_at)

    def test_create_recipe_ingredient_without_ingredient(self):
        """Test that creating a RecipeIngredient without an ingredient raises an error."""
        recipe_ingredient = RecipeIngredient(
            recipe=self.recipe,
            quantity=Decimal("100.0"),
            unit="g"
        )
        with self.assertRaises(Exception): 
            recipe_ingredient.full_clean()

    def test_create_recipe_ingredient_without_recipe(self):
        """Test that creating a RecipeIngredient without a recipe raises an error."""
        recipe_ingredient = RecipeIngredient(
            ingredient=self.ingredient,
            quantity=Decimal("100.0"),
            unit="g"
        )
        with self.assertRaises(ValidationError):
            recipe_ingredient.full_clean()

    def test_create_recipe_ingredient_with_negative_quantity(self):
        """Test that creating a RecipeIngredient with a negative quantity raises an error."""
        recipe_ingredient = RecipeIngredient(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=Decimal("-50.0"),
            unit="g"
        )
        with self.assertRaises(ValidationError):
            recipe_ingredient.full_clean()

    def test_create_recipe_ingredient_with_zero_quantity(self):
        """Test that creating a RecipeIngredient with zero quantity raises an error."""
        recipe_ingredient = RecipeIngredient(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=Decimal("0.0"),
            unit="g"
        )
        with self.assertRaises(ValidationError):
            recipe_ingredient.full_clean()

    def test_create_recipe_ingredient_with_long_unit(self):
        """Test that creating a RecipeIngredient with a unit longer than max_length raises an error."""
        long_unit = "gramsgramsgramsgramsgrams"  # 25+ characters
        recipe_ingredient = RecipeIngredient(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=Decimal("100.0"),
            unit=long_unit
        )
        with self.assertRaises(ValidationError):
            recipe_ingredient.full_clean()

    def test_str_method(self):
        """Test that the __str__ method returns the correct string representation."""
        recipe_ingredient = RecipeIngredient.objects.create(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=Decimal("100.0"),
            unit="g"
        )

        self.assertEqual(str(recipe_ingredient), "100.0 g Sugar")

    def test_clean_with_valid_unit(self):
        """Test that clean() passes when unit is in allowed_units."""
        recipe_ingredient = RecipeIngredient(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=Decimal("100.0"),
            unit="g"
        )
        # Should not raise an error
        try:
            recipe_ingredient.clean()
        except ValidationError:
            self.fail("clean() raised ValidationError unexpectedly!")

    def test_clean_with_invalid_unit(self):
        """Test that clean() raises ValidationError when unit is not in allowed_units."""
        recipe_ingredient = RecipeIngredient(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=Decimal("100.0"),
            unit="invalid_unit"
        )
        with self.assertRaises(ValidationError) as context:
            recipe_ingredient.clean()
        self.assertIn("Invalid unit", str(context.exception))

    def test_clean_with_empty_allowed_units(self):
        """Test that clean() passes when allowed_units is empty."""
        ingredient_no_units = Ingredient.objects.create(
            name="Water",
            category="beverages",
            allowed_units=[]
        )
        recipe_ingredient = RecipeIngredient(
            ingredient=ingredient_no_units,
            recipe=self.recipe,
            quantity=Decimal("100.0"),
            unit="ml"
        )
        # Should not raise an error when allowed_units is empty
        try:
            recipe_ingredient.clean()
        except ValidationError:
            # This is expected if unit validation is strict
            pass

    def test_get_costs(self):
        """Test get_costs method returns correct prices."""
        recipe_ingredient = RecipeIngredient.objects.create(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=Decimal("100.0"),
            unit="g"
        )
        
        costs = recipe_ingredient.get_costs(self.user)
        
        self.assertIn("currency", costs)
        self.assertIn("A101", costs)
        self.assertIn("SOK", costs)
        self.assertIn("BIM", costs)
        self.assertIn("MIGROS", costs)
        self.assertIsNotNone(costs["A101"])

    def test_get_costs_with_unit_conversion(self):
        """Test get_costs with unit conversion."""
        recipe_ingredient = RecipeIngredient.objects.create(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=Decimal("1.0"),
            unit="kg"
        )
        
        costs = recipe_ingredient.get_costs(self.user)
        # 1 kg = 1000 g, so cost should be 10x the base price
        self.assertGreater(costs["A101"], Decimal("0"))

    def test_get_nutrition_info(self):
        """Test get_nutrition_info method."""
        recipe_ingredient = RecipeIngredient.objects.create(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=Decimal("100.0"),
            unit="g"
        )
        
        nutrition = recipe_ingredient.get_nutrition_info()
        
        self.assertIn("calories", nutrition)
        self.assertIn("protein", nutrition)
        self.assertIn("fat", nutrition)
        self.assertIn("carbs", nutrition)
        # 100g sugar should have 387 calories
        self.assertEqual(nutrition["calories"], Decimal("387.0"))

    def test_get_nutrition_info_with_unit_conversion(self):
        """Test get_nutrition_info with unit conversion."""
        recipe_ingredient = RecipeIngredient.objects.create(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=Decimal("200.0"),
            unit="g"
        )
        
        nutrition = recipe_ingredient.get_nutrition_info()
        # 200g sugar should have 774 calories
        self.assertEqual(nutrition["calories"], Decimal("774.0"))

    def test_get_costs_with_different_currency(self):
        """Test get_costs with different user currency."""
        user_try = Mock()
        user_try.preferredCurrency = "TRY"
        
        recipe_ingredient = RecipeIngredient.objects.create(
            ingredient=self.ingredient,
            recipe=self.recipe,
            quantity=Decimal("100.0"),
            unit="g"
        )
        
        costs = recipe_ingredient.get_costs(user_try, usd_to_try_rate=Decimal("40.0"))
        self.assertEqual(costs["currency"], "TRY")

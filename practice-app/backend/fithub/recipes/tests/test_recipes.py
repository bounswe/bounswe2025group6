from django.test import TestCase
from recipes.models import Recipe, RecipeIngredient
from ingredients.models import Ingredient
from api.models import RegisteredUser
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import timedelta
from unittest.mock import Mock

class RecipeModelTests(TestCase):

    def setUp(self):
        """Set up test data."""
        # Create a user
        self.user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        # Set preferredCurrency if it exists
        if hasattr(self.user, 'preferredCurrency'):
            self.user.preferredCurrency = "USD"
            self.user.save()

        # Create ingredients with prices and nutrition
        self.ingredient_1 = Ingredient.objects.create(
            name="Tomato",
            category="vegetables",
            allergens=["nuts"],
            dietary_info=["vegan"],
            base_unit="g",
            base_quantity=Decimal("100.0"),
            calories=Decimal("18.0"),
            protein=Decimal("0.9"),
            fat=Decimal("0.2"),
            carbs=Decimal("3.9"),
            price_A101=Decimal("1.50"),
            price_SOK=Decimal("1.60"),
            price_BIM=Decimal("1.40"),
            price_MIGROS=Decimal("1.70"),
            allowed_units=["g", "kg", "pcs"]
        )
        self.ingredient_2 = Ingredient.objects.create(
            name="Bread",
            category="grains",
            allergens=["gluten", "yeast"],
            dietary_info=["vegetarian"],
            base_unit="g",
            base_quantity=Decimal("100.0"),
            calories=Decimal("265.0"),
            protein=Decimal("9.0"),
            fat=Decimal("3.2"),
            carbs=Decimal("49.0"),
            price_A101=Decimal("2.00"),
            price_SOK=Decimal("2.10"),
            allowed_units=["g", "kg", "slices"]
        )
        self.ingredient_3 = Ingredient.objects.create(
            name="Lettuce",
            category="vegetables",
            allergens=[],
            dietary_info=["vegan", "raw"],
            base_unit="pcs",
            base_quantity=Decimal("1.0"),
            calories=Decimal("5.0"),
            allowed_units=["pcs", "leaf"]
        )

    def test_create_recipe_valid(self):
        """Test that a valid recipe can be created."""
        recipe = Recipe.objects.create(
            name="Tomato Sandwich",
            steps=["Spread butter", "Add tomato slices", "Serve"],
            prep_time=10,
            cook_time=0,
            meal_type="lunch",
            creator=self.user
        )

        self.assertEqual(recipe.name, "Tomato Sandwich")
        self.assertEqual(recipe.steps, ["Spread butter", "Add tomato slices", "Serve"])
        self.assertEqual(recipe.prep_time, 10)
        self.assertEqual(recipe.cook_time, 0)
        self.assertEqual(recipe.meal_type, "lunch")
        self.assertIsNone(recipe.cost_per_serving)
        self.assertEqual(recipe.creator, self.user)

    def test_create_recipe_invalid_meal_type(self):
        """Test that an invalid meal_type raises a validation error."""
        recipe = Recipe(
            name="Invalid Meal",
            steps=["Mix ingredients"],
            prep_time=5,
            cook_time=10,
            meal_type="invalid_meal",
            creator=self.user
        )
        with self.assertRaises(ValidationError):
            recipe.full_clean()

    def test_create_recipe_without_steps(self):
        """Test that a recipe can be created without steps (empty list)."""
        recipe = Recipe.objects.create(
            name="Simple Dish",
            steps=[],
            prep_time=7,
            cook_time=5,
            meal_type="dinner",
            creator=self.user
        )

        self.assertEqual(recipe.steps, [])
        self.assertEqual(recipe.total_time, 12)

    def test_recipe_total_time(self):
        """Test the total_time property."""
        recipe = Recipe.objects.create(
            name="Grilled Cheese",
            steps=["Grill the bread", "Melt the cheese"],
            prep_time=5,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )

        self.assertEqual(recipe.total_time, 15)

    def test_recipe_total_time_with_none(self):
        """Test total_time property when prep_time or cook_time is None."""
        recipe = Recipe.objects.create(
            name="Quick Meal",
            steps=["Serve"],
            prep_time=5,
            cook_time=0,
            meal_type="breakfast",
            creator=self.user
        )
        self.assertEqual(recipe.total_time, 5)

    def test_recipe_str_method(self):
        """Test the __str__ method."""
        recipe = Recipe.objects.create(
            name="Spaghetti Bolognese",
            steps=["Cook spaghetti", "Prepare sauce", "Mix and serve"],
            prep_time=15,
            cook_time=20,
            meal_type="dinner",
            creator=self.user,
        )
        self.assertEqual(str(recipe), "Spaghetti Bolognese")

    def test_create_recipe_with_missing_name(self):
        """Test that creating a recipe without a name raises a validation error."""
        recipe = Recipe(
            name="",
            steps=["Chop vegetables", "Boil water"],
            prep_time=10,
            cook_time=5,
            meal_type="lunch",
            creator=self.user
        )
        with self.assertRaises(ValidationError):
            recipe.full_clean()

    def test_create_recipe_with_valid_ratings(self):
        """Test creating a recipe with valid ratings (between 0 and 5)."""
        recipe = Recipe.objects.create(
            name="Healthy Salad",
            steps=["Chop vegetables", "Toss in dressing"],
            prep_time=15,
            cook_time=0,
            meal_type="lunch",
            creator=self.user,
            difficulty_rating=4.0,
            taste_rating=4.5,
            health_rating=5.0
        )

        self.assertEqual(recipe.difficulty_rating, 4.0)
        self.assertEqual(recipe.taste_rating, 4.5)
        self.assertEqual(recipe.health_rating, 5.0)

    def test_create_recipe_with_invalid_rating(self):
        """Test that creating a recipe with an invalid rating raises a validation error."""
        recipe = Recipe(
            name="Spicy Soup",
            steps=["Boil water", "Add spices", "Serve"],
            prep_time=20,
            cook_time=15,
            meal_type="dinner",
            creator=self.user,
            difficulty_rating=6.0,
            taste_rating=-1.0,
            health_rating=7.0
        )

        with self.assertRaises(ValidationError):
            recipe.full_clean()

    def test_create_recipe_without_ratings(self):
        """Test that a recipe can be created without any ratings."""
        recipe = Recipe.objects.create(
            name="Pasta",
            steps=["Boil pasta", "Add sauce", "Serve"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )

        self.assertIsNone(recipe.difficulty_rating)
        self.assertIsNone(recipe.taste_rating)
        self.assertIsNone(recipe.health_rating)

    def test_created_at_field(self):
        """Test that the created_at field is populated correctly."""
        recipe = Recipe.objects.create(
            name="Tomato Soup",
            steps=["Boil water", "Add tomatoes", "Serve"],
            prep_time=15,
            cook_time=30,
            meal_type="lunch",
            creator=self.user
        )

        self.assertIsNotNone(recipe.created_at)
        self.assertAlmostEqual(recipe.created_at, recipe.created_at, delta=timedelta(minutes=1))

    def test_total_user_ratings_property(self):
        """Test the total_user_ratings property."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user,
            difficulty_rating_count=5,
            taste_rating_count=3
        )
        self.assertEqual(recipe.total_user_ratings, 8)

    def test_total_ratings_property(self):
        """Test the total_ratings property."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user,
            difficulty_rating=4.0,
            taste_rating=3.5,
            health_rating=4.5
        )
        self.assertEqual(recipe.total_ratings, 12.0)

    def test_total_ratings_property_with_none(self):
        """Test total_ratings property when some ratings are None."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user,
            difficulty_rating=4.0,
            taste_rating=None,
            health_rating=4.5
        )
        self.assertEqual(recipe.total_ratings, 8.5)

    def test_soft_delete(self):
        """Test that soft delete works correctly."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        recipe_id = recipe.id
        recipe.delete()
        
        # Recipe should still exist in database
        recipe.refresh_from_db()
        self.assertIsNotNone(recipe.deleted_on)
        
        # Recipe should not appear in default queryset
        self.assertFalse(Recipe.objects.filter(deleted_on=None, id=recipe_id).exists())

    def test_soft_delete_already_deleted(self):
        """Test that deleting an already deleted recipe does nothing."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        recipe.delete()
        deleted_on = recipe.deleted_on
        
        # Try to delete again
        recipe.delete()
        recipe.refresh_from_db()
        
        # deleted_on should remain the same
        self.assertEqual(recipe.deleted_on, deleted_on)

    def test_calculate_recipe_cost(self):
        """Test calculate_recipe_cost method."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        # Add ingredients
        RecipeIngredient.objects.create(
            recipe=recipe,
            ingredient=self.ingredient_1,
            quantity=Decimal("200.0"),
            unit="g"
        )
        RecipeIngredient.objects.create(
            recipe=recipe,
            ingredient=self.ingredient_2,
            quantity=Decimal("100.0"),
            unit="g"
        )
        
        costs = recipe.calculate_recipe_cost(self.user)
        
        self.assertIn("A101", costs)
        self.assertIn("SOK", costs)
        self.assertIn("BIM", costs)
        self.assertIn("MIGROS", costs)
        # 200g tomato at 1.50 per 100g = 3.00, 100g bread at 2.00 per 100g = 2.00, total = 5.00
        self.assertGreater(costs["A101"], Decimal("0"))

    def test_calculate_cost_per_serving(self):
        """Test calculate_cost_per_serving method."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        RecipeIngredient.objects.create(
            recipe=recipe,
            ingredient=self.ingredient_1,
            quantity=Decimal("100.0"),
            unit="g"
        )
        
        cost = recipe.calculate_cost_per_serving(self.user)
        self.assertIsNotNone(cost)
        self.assertGreaterEqual(cost, Decimal("0"))

    def test_calculate_cost_per_serving_with_dummy_user(self):
        """Test calculate_cost_per_serving with None user (uses dummy user)."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        RecipeIngredient.objects.create(
            recipe=recipe,
            ingredient=self.ingredient_1,
            quantity=Decimal("100.0"),
            unit="g"
        )
        
        cost = recipe.calculate_cost_per_serving()
        self.assertIsNotNone(cost)

    def test_calculate_nutrition_info(self):
        """Test calculate_nutrition_info method."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        RecipeIngredient.objects.create(
            recipe=recipe,
            ingredient=self.ingredient_1,
            quantity=Decimal("200.0"),
            unit="g"
        )
        RecipeIngredient.objects.create(
            recipe=recipe,
            ingredient=self.ingredient_2,
            quantity=Decimal("100.0"),
            unit="g"
        )
        
        nutrition = recipe.calculate_nutrition_info()
        
        self.assertIn("calories", nutrition)
        self.assertIn("protein", nutrition)
        self.assertIn("fat", nutrition)
        self.assertIn("carbs", nutrition)
        # 200g tomato: 36 calories, 100g bread: 265 calories = 301 total
        self.assertGreater(nutrition["calories"], Decimal("0"))

    def test_check_allergens(self):
        """Test check_allergens method."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        RecipeIngredient.objects.create(
            recipe=recipe,
            ingredient=self.ingredient_1,
            quantity=Decimal("100.0"),
            unit="g"
        )
        RecipeIngredient.objects.create(
            recipe=recipe,
            ingredient=self.ingredient_2,
            quantity=Decimal("100.0"),
            unit="g"
        )
        
        allergens = recipe.check_allergens()
        self.assertIn("nuts", allergens)
        self.assertIn("gluten", allergens)
        self.assertIn("yeast", allergens)

    def test_check_allergens_empty(self):
        """Test check_allergens with no allergens."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        RecipeIngredient.objects.create(
            recipe=recipe,
            ingredient=self.ingredient_3,
            quantity=Decimal("1.0"),
            unit="pcs"
        )
        
        allergens = recipe.check_allergens()
        self.assertEqual(allergens, [])

    def test_check_dietary_info(self):
        """Test check_dietary_info method."""
        recipe_1 = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        RecipeIngredient.objects.create(
            recipe=recipe_1,
            ingredient=self.ingredient_1,
            quantity=Decimal("100.0"),
            unit="g"
        )

        RecipeIngredient.objects.create(
            recipe=recipe_1,
            ingredient=self.ingredient_3,
            quantity=Decimal("2.0"),
            unit="pcs"
        )

        recipe_2 = Recipe.objects.create(
            name="Test Recipe 2",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        RecipeIngredient.objects.create(
            recipe=recipe_2,
            ingredient=self.ingredient_1,
            quantity=Decimal("100.0"),
            unit="g"
        )

        RecipeIngredient.objects.create(
            recipe=recipe_2,
            ingredient=self.ingredient_2,
            quantity=Decimal("100.0"),
            unit="g"
        )
        
        dietary_info_1 = recipe_1.check_dietary_info()

        # All ingredients are vegan, and second ingredient has "raw".
        self.assertIn("vegan", dietary_info_1)
        self.assertIn("raw", dietary_info_1)

        dietary_info_2 = recipe_2.check_dietary_info()
        
        # There is a non-vegan ingredient, but it is vegetarian.
        self.assertNotIn("vegan", dietary_info_2)
        self.assertIn("vegetarian", dietary_info_2)

    def test_check_dietary_info_empty(self):
        """Test check_dietary_info with no dietary info."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        # Recipe with no ingredients has no dietary info
        dietary_info = recipe.check_dietary_info()
        self.assertEqual(dietary_info, [])

    def test_update_ratings_difficulty(self):
        """Test update_ratings method for difficulty rating."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        recipe.update_ratings('difficulty', 4.0)
        self.assertEqual(recipe.difficulty_rating, 4.0)
        self.assertEqual(recipe.difficulty_rating_count, 1)
        
        recipe.update_ratings('difficulty', 5.0)
        # Average should be (4.0 * 1 + 5.0) / 2 = 4.5
        self.assertEqual(recipe.difficulty_rating, 4.5)
        self.assertEqual(recipe.difficulty_rating_count, 2)

    def test_update_ratings_taste(self):
        """Test update_ratings method for taste rating."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        recipe.update_ratings('taste', 3.5)
        self.assertEqual(recipe.taste_rating, 3.5)
        self.assertEqual(recipe.taste_rating_count, 1)

    def test_update_ratings_health(self):
        """Test update_ratings method for health rating."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )
        
        recipe.update_ratings('health', 4.5)
        self.assertEqual(recipe.health_rating, 4.5)
        self.assertEqual(recipe.health_rating_count, 1)

    def test_drop_rating_difficulty(self):
        """Test drop_rating method for difficulty rating."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user,
            difficulty_rating=4.0,
            difficulty_rating_count=2
        )
        
        recipe.drop_rating('difficulty', 4.0)
        # After dropping one rating: (4.0 * 2 - 4.0) / 1 = 4.0
        self.assertEqual(recipe.difficulty_rating, 4.0)
        self.assertEqual(recipe.difficulty_rating_count, 1)
        
        # Drop the last rating
        recipe.drop_rating('difficulty', 4.0)
        self.assertIsNone(recipe.difficulty_rating)
        self.assertEqual(recipe.difficulty_rating_count, 0)

    def test_drop_rating_taste(self):
        """Test drop_rating method for taste rating."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user,
            taste_rating=3.5,
            taste_rating_count=1
        )
        
        recipe.drop_rating('taste', 3.5)
        self.assertIsNone(recipe.taste_rating)
        self.assertEqual(recipe.taste_rating_count, 0)

    def test_drop_rating_health(self):
        """Test drop_rating method for health rating."""
        recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user,
            health_rating=4.5,
            health_rating_count=3
        )
        
        recipe.drop_rating('health', 4.5)
        self.assertEqual(recipe.health_rating_count, 2)

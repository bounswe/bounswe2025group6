from django.test import TestCase
from recipes.models import Recipe, Ingredient
from api.models import RegisteredUser
from django.core.exceptions import ValidationError
from datetime import timedelta

class RecipeModelTests(TestCase):

    def setUp(self):
        """Set up test data."""
        # Create a user
        self.user = RegisteredUser.objects.create(username="testuser", email="test@example.com")

        # Create ingredients
        self.ingredient_1 = Ingredient.objects.create(
            name="Tomato", category="vegetables", allergens=["nuts"], dietary_info=["vegan"]
        )
        self.ingredient_2 = Ingredient.objects.create(
            name="Bread", category="grains", allergens=["gluten", "yeast"], dietary_info=["vegetarian"]
        )
        self.ingredient_3 = Ingredient.objects.create(
            name="Lettuce", category="vegetables", allergens=[], dietary_info=["raw"]
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
        self.assertIsNone(recipe.cost_per_serving) # Check whether cost_per_serving is set to None by default
        self.assertEqual(recipe.creator, self.user)

    def test_create_recipe_invalid_meal_type(self):
        """Test that an invalid meal_type raises a validation error."""
        recipe = Recipe(
            name="Invalid Meal",
            steps=["Mix ingredients"],
            prep_time=5,
            cook_time=10,
            meal_type="invalid_meal",  # Invalid meal type
            creator=self.user
        )
        with self.assertRaises(ValidationError):
            recipe.full_clean()  # Will raise ValidationError due to invalid meal_type

    def test_create_recipe_without_steps(self):
        """Test that a recipe can be created without steps (empty list)."""
        recipe = Recipe.objects.create(
            name="Simple Dish",
            steps=[],         # Empty steps list (valid) (it cannot be None however)
            prep_time=7,
            cook_time=5,
            meal_type="dinner",
            creator=self.user
        )

        self.assertEqual(recipe.steps, [])
        self.assertEqual(recipe.total_time, 12)  # prep_time + cook_time = 7 + 5 = 12 minutes

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

        self.assertEqual(recipe.total_time, 15)  # 5 + 10 = 15 minutes

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
            name="",  # Empty name should not be allowed (null=false) (cannot be None or "")
            steps=["Chop vegetables", "Boil water"],
            prep_time=10,
            cook_time=5,
            meal_type="lunch",
            creator=self.user
        )
        with self.assertRaises(ValidationError):
            recipe.full_clean()  # Will raise ValidationError because name is empty

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
        """Test that creating a recipe with an invalid rating (less than 0 or more than 5) raises a validation error."""
        recipe = Recipe(
            name="Spicy Soup",
            steps=["Boil water", "Add spices", "Serve"],
            prep_time=20,
            cook_time=15,
            meal_type="dinner",
            creator=self.user,
            difficulty_rating=6.0,  # Invalid rating
            taste_rating=-1.0,
            health_rating=7.0       # Invalid rating
        )

        with self.assertRaises(ValidationError):
            recipe.full_clean()  # Will raise ValidationError because of invalid ratings

    def test_create_recipe_without_ratings(self):
        """Test that a recipe can be created without any ratings (ratings are optional)."""
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
        """Test that the created_at field is populated correctly when the recipe is created."""
        recipe = Recipe.objects.create(
            name="Tomato Soup",
            steps=["Boil water", "Add tomatoes", "Serve"],
            prep_time=15,
            cook_time=30,
            meal_type="lunch",
            creator=self.user
        )

        # Optionally, you can check that it is not more than a minute old
        self.assertAlmostEqual(recipe.created_at, recipe.created_at, delta=timedelta(minutes=1))

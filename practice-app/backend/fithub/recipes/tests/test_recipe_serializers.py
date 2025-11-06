from django.test import TestCase
from rest_framework.test import APIClient
from api.models import RegisteredUser
from recipes.models import Recipe, RecipeIngredient
from ingredients.models import Ingredient
from recipes.serializers import (
    RecipeCreateSerializer,
    RecipeUpdateSerializer,
    RecipeListSerializer,
    RecipeDetailSerializer,
    RecipeIngredientOutputSerializer
)
from decimal import Decimal
from unittest.mock import Mock
import json
from django.test import RequestFactory

class RecipeIngredientOutputSerializerTests(TestCase):
    """Tests for RecipeIngredientOutputSerializer"""

    def setUp(self):
        """Set up test fixtures"""
        self.user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        if hasattr(self.user, 'preferredCurrency'):
            self.user.preferredCurrency = "USD"
            self.user.save()

        self.ingredient = Ingredient.objects.create(
            name="Tomato",
            category="vegetables",
            base_unit="g",
            base_quantity=Decimal("100.0"),
            calories=Decimal("18.0"),
            protein=Decimal("0.9"),
            price_A101=Decimal("1.50"),
            allowed_units=["g", "kg"]
        )

        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )

        self.recipe_ingredient = RecipeIngredient.objects.create(
            recipe=self.recipe,
            ingredient=self.ingredient,
            quantity=Decimal("200.0"),
            unit="g"
        )

    def test_recipe_ingredient_output_serializer_basic_fields(self):
        """Test that RecipeIngredientOutputSerializer includes all basic fields."""
        request = RequestFactory().get("/")
        request.user = self.user
        
        serializer = RecipeIngredientOutputSerializer(
            self.recipe_ingredient,
            context={"request": request}
        )
        data = serializer.data
        
        self.assertIn("ingredient", data)
        self.assertEqual(data["quantity"], "200.00")
        self.assertEqual(data["unit"], "g")
        self.assertIn("costs_for_recipe", data)
        self.assertIn("nutrion_info_for_recipe", data)

    def test_recipe_ingredient_output_serializer_costs(self):
        """Test that costs_for_recipe is included."""
        request = RequestFactory().get("/")
        request.user = self.user
        
        serializer = RecipeIngredientOutputSerializer(
            self.recipe_ingredient,
            context={"request": request}
        )
        data = serializer.data
        
        self.assertIn("costs_for_recipe", data)
        self.assertIn("A101", data["costs_for_recipe"])

    def test_recipe_ingredient_output_serializer_nutrition(self):
        """Test that nutrion_info_for_recipe is included."""
        serializer = RecipeIngredientOutputSerializer(self.recipe_ingredient)
        data = serializer.data
        
        self.assertIn("nutrion_info_for_recipe", data)
        self.assertIn("calories", data["nutrion_info_for_recipe"])


class RecipeListSerializerTests(TestCase):
    """Tests for RecipeListSerializer"""

    def setUp(self):
        """Set up test fixtures"""
        self.user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        if hasattr(self.user, 'preferredCurrency'):
            self.user.preferredCurrency = "USD"
            self.user.save()

        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1", "Step 2"],
            prep_time=10,
            cook_time=20,
            meal_type="lunch",
            creator=self.user,
            difficulty_rating=4.0,
            taste_rating=3.5,
            like_count=5
        )

    def test_recipe_list_serializer_basic_fields(self):
        """Test that RecipeListSerializer includes all basic fields."""
        request = RequestFactory().get("/")
        request.user = self.user
        
        serializer = RecipeListSerializer(
            self.recipe,
            context={"request": request}
        )
        data = serializer.data
        
        self.assertEqual(data["name"], "Test Recipe")
        self.assertEqual(data["meal_type"], "lunch")
        self.assertEqual(data["creator_id"], self.user.id)
        self.assertEqual(data["prep_time"], 10)
        self.assertEqual(data["cook_time"], 20)
        self.assertIn("recipe_costs", data)
        self.assertIn("recipe_nutritions", data)
        self.assertEqual(data["difficulty_rating"], 4.0)
        self.assertEqual(data["taste_rating"], 3.5)
        self.assertEqual(data["like_count"], 5)

    def test_recipe_list_serializer_total_time(self):
        """Test that total_time is computed correctly."""
        serializer = RecipeListSerializer(self.recipe)
        data = serializer.data
        
        self.assertEqual(data["total_time"], 30)  # 10 + 20

    def test_recipe_list_serializer_recipe_costs(self):
        """Test that recipe_costs is included."""
        request = RequestFactory().get("/")
        request.user = self.user
        
        serializer = RecipeListSerializer(
            self.recipe,
            context={"request": request}
        )
        data = serializer.data
        
        self.assertIn("recipe_costs", data)
        self.assertIsInstance(data["recipe_costs"], dict)

    def test_recipe_list_serializer_recipe_nutritions(self):
        """Test that recipe_nutritions is included."""
        serializer = RecipeListSerializer(self.recipe)
        data = serializer.data
        
        self.assertIn("recipe_nutritions", data)
        self.assertIsInstance(data["recipe_nutritions"], dict)


class RecipeDetailSerializerTests(TestCase):
    """Tests for RecipeDetailSerializer"""

    def setUp(self):
        """Set up test fixtures"""
        self.user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        if hasattr(self.user, 'preferredCurrency'):
            self.user.preferredCurrency = "USD"
            self.user.save()

        self.ingredient = Ingredient.objects.create(
            name="Tomato",
            category="vegetables",
            base_unit="g",
            base_quantity=Decimal("100.0"),
            allergens=["nuts"],
            dietary_info=["vegan"],
            allowed_units=["g", "kg"]
        )

        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1", "Step 2"],
            prep_time=10,
            cook_time=20,
            meal_type="lunch",
            creator=self.user
        )

        RecipeIngredient.objects.create(
            recipe=self.recipe,
            ingredient=self.ingredient,
            quantity=Decimal("200.0"),
            unit="g"
        )

    def test_recipe_detail_serializer_basic_fields(self):
        """Test that RecipeDetailSerializer includes all basic fields."""
        request = RequestFactory().get("/")
        request.user = self.user
        
        serializer = RecipeDetailSerializer(
            self.recipe,
            context={"request": request}
        )
        data = serializer.data
        
        self.assertEqual(data["name"], "Test Recipe")
        self.assertEqual(data["steps"], ["Step 1", "Step 2"])
        self.assertEqual(data["prep_time"], 10)
        self.assertEqual(data["cook_time"], 20)
        self.assertEqual(data["meal_type"], "lunch")
        self.assertEqual(data["creator_id"], self.user.id)
        self.assertIn("ingredients", data)
        self.assertIn("allergens", data)
        self.assertIn("dietary_info", data)

    def test_recipe_detail_serializer_allergens(self):
        """Test that allergens are included."""
        serializer = RecipeDetailSerializer(self.recipe)
        data = serializer.data
        
        self.assertIn("allergens", data)
        self.assertIn("nuts", data["allergens"])

    def test_recipe_detail_serializer_dietary_info(self):
        """Test that dietary_info is included."""
        serializer = RecipeDetailSerializer(self.recipe)
        data = serializer.data
        
        self.assertIn("dietary_info", data)
        self.assertIn("vegan", data["dietary_info"])

    def test_recipe_detail_serializer_ingredients(self):
        """Test that ingredients are included."""
        request = RequestFactory().get("/")
        request.user = self.user
        
        serializer = RecipeDetailSerializer(
            self.recipe,
            context={"request": request}
        )
        data = serializer.data
        
        self.assertIn("ingredients", data)
        self.assertIsInstance(data["ingredients"], list)
        self.assertEqual(len(data["ingredients"]), 1)

    def test_recipe_detail_serializer_total_time(self):
        """Test that total_time is computed correctly."""
        serializer = RecipeDetailSerializer(self.recipe)
        data = serializer.data
        
        self.assertEqual(data["total_time"], 30)

    def test_recipe_detail_serializer_recipe_costs(self):
        """Test that recipe_costs is included."""
        request = RequestFactory().get("/")
        request.user = self.user
        
        serializer = RecipeDetailSerializer(
            self.recipe,
            context={"request": request}
        )
        data = serializer.data
        
        self.assertIn("recipe_costs", data)
        self.assertIsInstance(data["recipe_costs"], dict)


class RecipeCreateSerializerTests(TestCase):
    """Tests for RecipeCreateSerializer"""

    def setUp(self):
        """Set up test fixtures"""
        self.user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        if hasattr(self.user, 'preferredCurrency'):
            self.user.preferredCurrency = "USD"
            self.user.save()

        self.ingredient = Ingredient.objects.create(
            name="Tomato",
            category="vegetables",
            base_unit="g",
            base_quantity=Decimal("100.0"),
            allowed_units=["g", "kg"]
        )

    def test_recipe_create_serializer_valid_data(self):
        """Test creating a recipe with valid data."""
        request = RequestFactory().get("/")
        request.user = self.user
        
        data = {
            "name": "New Recipe",
            "steps": ["Step 1", "Step 2"],
            "prep_time": 10,
            "cook_time": 20,
            "meal_type": "lunch",
            "ingredients": json.dumps([
                {"ingredient_name": "Tomato", "quantity": 200, "unit": "g"}
            ])
        }
        
        serializer = RecipeCreateSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())
        recipe = serializer.save()
        
        self.assertEqual(recipe.name, "New Recipe")
        self.assertEqual(recipe.creator, self.user)
        self.assertEqual(recipe.recipe_ingredients.count(), 1)

    def test_recipe_create_serializer_invalid_ingredient(self):
        """Test creating a recipe with invalid ingredient."""
        request = RequestFactory().get("/")
        request.user = self.user
        
        data = {
            "name": "New Recipe",
            "steps": ["Step 1"],
            "prep_time": 10,
            "cook_time": 10,
            "meal_type": "lunch",
            "ingredients": json.dumps([
                {"ingredient_name": "Nonexistent", "quantity": 100, "unit": "g"}
            ])
        }
        
        serializer = RecipeCreateSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())


class RecipeUpdateSerializerTests(TestCase):
    """Tests for RecipeUpdateSerializer"""

    def setUp(self):
        """Set up test fixtures"""
        self.user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        if hasattr(self.user, 'preferredCurrency'):
            self.user.preferredCurrency = "USD"
            self.user.save()

        self.ingredient = Ingredient.objects.create(
            name="Tomato",
            category="vegetables",
            base_unit="g",
            base_quantity=Decimal("100.0"),
            allowed_units=["g", "kg"]
        )

        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )

    def test_recipe_update_serializer_partial_update(self):
        """Test partial update of a recipe."""
        request = RequestFactory().get("/")
        request.user = self.user
        
        data = {
            "name": "Updated Recipe"
        }
        
        serializer = RecipeUpdateSerializer(
            self.recipe,
            data=data,
            partial=True,
            context={"request": request}
        )
        self.assertTrue(serializer.is_valid())
        updated_recipe = serializer.save()
        
        self.assertEqual(updated_recipe.name, "Updated Recipe")

    def test_recipe_update_serializer_update_ingredients(self):
        """Test updating recipe ingredients."""
        request = RequestFactory().get("/")
        request.user = self.user
        
        data = {
            "ingredients": json.dumps([
                {"ingredient_name": "Tomato", "quantity": 300, "unit": "g"}
            ])
        }
        
        serializer = RecipeUpdateSerializer(
            self.recipe,
            data=data,
            partial=True,
            context={"request": request}
        )
        self.assertTrue(serializer.is_valid())
        updated_recipe = serializer.save()
        
        self.assertEqual(updated_recipe.recipe_ingredients.count(), 1)
        ri = updated_recipe.recipe_ingredients.first()
        self.assertEqual(ri.quantity, Decimal("300.0"))


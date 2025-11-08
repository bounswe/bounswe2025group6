from django.test import TestCase
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.urls import reverse
from api.models import RegisteredUser
from recipes.models import Recipe, RecipeIngredient
from ingredients.models import Ingredient
from decimal import Decimal
import json

class RecipeViewSetTests(APITestCase):
    """Tests for RecipeViewSet API endpoints"""

    def setUp(self):
        """Set up test fixtures"""
        self.client = APIClient()
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
            allowed_units=["g", "kg", "pcs"]
        )

        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1", "Step 2"],
            prep_time=10,
            cook_time=20,
            meal_type="lunch",
            creator=self.user
        )

    def test_list_recipes_unauthenticated(self):
        """Test that listing recipes requires authentication."""
        url = reverse("recipe-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_recipes_authenticated(self):
        """Test listing recipes when authenticated."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)

    def test_list_recipes_pagination(self):
        """Test pagination in recipe list."""
        self.client.force_authenticate(user=self.user)
        # Create multiple recipes
        for i in range(15):
            Recipe.objects.create(
                name=f"Recipe {i}",
                steps=["Step 1"],
                prep_time=10,
                cook_time=10,
                meal_type="lunch",
                creator=self.user
            )
        
        url = reverse("recipe-list")
        response = self.client.get(url, {"page_size": 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 5)
        self.assertIn("page", response.data)
        self.assertIn("total", response.data)

    def test_retrieve_recipe(self):
        """Test retrieving a specific recipe."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-detail", kwargs={"pk": self.recipe.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Test Recipe")
        self.assertEqual(response.data["id"], self.recipe.pk)

    def test_retrieve_nonexistent_recipe(self):
        """Test retrieving a nonexistent recipe returns 404."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-detail", kwargs={"pk": 99999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_recipe_unauthenticated(self):
        """Test that creating a recipe requires authentication."""
        url = reverse("recipe-list")
        data = {
            "name": "New Recipe",
            "steps": ["Step 1"],
            "prep_time": 10,
            "cook_time": 10,
            "meal_type": "lunch",
            "ingredients": json.dumps([
                {"ingredient_name": "Tomato", "quantity": 100, "unit": "g"}
            ])
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_recipe_authenticated(self):
        """Test creating a recipe when authenticated."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-list")
        data = {
            "name": "New Recipe",
            "steps": ["Step 1", "Step 2"],
            "prep_time": 10,
            "cook_time": 10,
            "meal_type": "lunch",
            "ingredients": json.dumps([
                {"ingredient_name": "Tomato", "quantity": 100, "unit": "g"}
            ])
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Recipe")
        self.assertIn("ingredients", response.data)

    def test_create_recipe_invalid_data(self):
        """Test creating a recipe with invalid data."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-list")
        data = {
            "name": "",  # Invalid: empty name
            "steps": ["Step 1"],
            "prep_time": 10,
            "cook_time": 10,
            "meal_type": "lunch"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_recipe(self):
        """Test updating a recipe."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-detail", kwargs={"pk": self.recipe.pk})
        data = {
            "name": "Updated Recipe",
            "steps": ["Updated Step 1"],
            "prep_time": 15,
            "cook_time": 25,
            "meal_type": "dinner"
        }
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Recipe")

    def test_update_recipe_ingredients(self):
        """Test updating recipe ingredients."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-detail", kwargs={"pk": self.recipe.pk})
        data = {
            "ingredients": json.dumps([
                {"ingredient_name": "Tomato", "quantity": 200, "unit": "g"}
            ])
        }
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_recipe(self):
        """Test soft deleting a recipe."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-detail", kwargs={"pk": self.recipe.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Recipe should be soft deleted
        self.recipe.refresh_from_db()
        self.assertIsNotNone(self.recipe.deleted_on)

    def test_delete_nonexistent_recipe(self):
        """Test deleting a nonexistent recipe."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-detail", kwargs={"pk": 99999})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_meal_planner_endpoint(self):
        """Test meal planner endpoint."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-meal-planner")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)

    def test_meal_planner_filter_by_name(self):
        """Test meal planner filtering by name."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-meal-planner")
        response = self.client.get(url, {"name": "Test"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["results"]), 1)

    def test_meal_planner_filter_by_meal_type(self):
        """Test meal planner filtering by meal type."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-meal-planner")
        response = self.client.get(url, {"meal_type": "lunch"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_meal_planner_filter_by_cost_range(self):
        """Test meal planner filtering by cost range."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-meal-planner")
        response = self.client.get(url, {
            "min_cost_per_serving": 0,
            "max_cost_per_serving": 100
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_meal_planner_filter_by_rating(self):
        """Test meal planner filtering by rating."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-meal-planner")
        response = self.client.get(url, {
            "min_difficulty_rating": 0,
            "max_difficulty_rating": 5
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_meal_planner_filter_by_time(self):
        """Test meal planner filtering by time."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-meal-planner")
        response = self.client.get(url, {
            "min_prep_time": 0,
            "max_prep_time": 60,
            "min_cook_time": 0,
            "max_cook_time": 60
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_meal_planner_filter_by_nutrition(self):
        """Test meal planner filtering by nutrition."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-meal-planner")
        response = self.client.get(url, {
            "min_calories": 0,
            "max_calories": 1000
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_meal_planner_filter_by_boolean_fields(self):
        """Test meal planner filtering by boolean fields."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-meal-planner")
        response = self.client.get(url, {
            "is_approved": "true",
            "is_featured": "false"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_meal_planner_invalid_meal_type(self):
        """Test meal planner with invalid meal type."""
        self.client.force_authenticate(user=self.user)
        url = reverse("recipe-meal-planner")
        response = self.client.get(url, {"meal_type": "invalid"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_meal_planner_pagination(self):
        """Test meal planner pagination."""
        self.client.force_authenticate(user=self.user)
        # Create multiple recipes
        for i in range(15):
            Recipe.objects.create(
                name=f"Recipe {i}",
                steps=["Step 1"],
                prep_time=10,
                cook_time=10,
                meal_type="lunch",
                creator=self.user
            )
        
        url = reverse("recipe-meal-planner")
        response = self.client.get(url, {"page_size": 5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 5)


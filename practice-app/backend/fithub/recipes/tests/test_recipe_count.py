from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from recipes.models import Recipe


def create_recipe(creator, name_suffix):
    """Utility to create a minimal valid Recipe instance."""
    return Recipe.objects.create(
        name=f"Recipe {name_suffix}",
        steps=["mix", "serve"],
        prep_time=5,
        cook_time=10,
        meal_type="lunch",
        creator=creator,
    )


class RecipeCountTests(APITestCase):
    """Tests for recipe count API endpoint and automatic recipeCount field updates"""
    
    def setUp(self):
        self.user_with_badge = get_user_model().objects.create_user(
            username="badge_user",
            email="badge@example.com",
            password="testpass123",
        )
        self.user_without_recipes = get_user_model().objects.create_user(
            username="no_recipe_user",
            email="norecipe@example.com",
            password="testpass123",
        )
        # Reset recipeCount to ensure clean state
        self.user_with_badge.recipeCount = 0
        self.user_with_badge.save()
        self.user_without_recipes.recipeCount = 0
        self.user_without_recipes.save()

    def test_user_with_many_recipes_gets_badge(self):
        """Test that API endpoint returns correct count and badge"""
        for idx in range(1, 6):
            create_recipe(self.user_with_badge, idx)

        url = reverse("user-recipe-count", kwargs={"user_id": self.user_with_badge.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["recipe_count"], 5)
        self.assertEqual(response.data["badge"], "Home Cook")
        
        # Verify that recipeCount field was automatically updated
        self.user_with_badge.refresh_from_db()
        self.assertEqual(self.user_with_badge.recipeCount, 5)

    def test_user_with_no_recipes_returns_zero_without_badge(self):
        """Test API endpoint for user with no recipes"""
        url = reverse("user-recipe-count", kwargs={"user_id": self.user_without_recipes.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["recipe_count"], 0)
        self.assertIsNone(response.data["badge"])
        
        # Verify recipeCount field is 0
        self.user_without_recipes.refresh_from_db()
        self.assertEqual(self.user_without_recipes.recipeCount, 0)

    def test_invalid_user_returns_zero_count(self):
        """Test API endpoint for invalid user ID"""
        missing_id = self.user_without_recipes.id + 999
        url = reverse("user-recipe-count", kwargs={"user_id": missing_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["recipe_count"], 0)
        self.assertEqual(response.data["user_id"], missing_id)

    def test_recipe_count_field_updates_on_create(self):
        """Test that recipeCount field is automatically updated when recipes are created"""
        initial_count = self.user_with_badge.recipeCount
        create_recipe(self.user_with_badge, "test1")
        
        self.user_with_badge.refresh_from_db()
        self.assertEqual(self.user_with_badge.recipeCount, initial_count + 1)

    def test_recipe_count_field_updates_on_delete(self):
        """Test that recipeCount field is automatically updated when recipes are deleted"""
        recipe = create_recipe(self.user_with_badge, "test1")
        self.user_with_badge.refresh_from_db()
        count_after_create = self.user_with_badge.recipeCount
        
        # Soft delete
        recipe.deleted_on = timezone.now()
        recipe.save()
        
        self.user_with_badge.refresh_from_db()
        self.assertEqual(self.user_with_badge.recipeCount, count_after_create - 1)

    def test_recipe_count_sync_with_api_endpoint(self):
        """Test that recipeCount field stays in sync with actual recipe count"""
        # Create some recipes
        for idx in range(1, 4):
            create_recipe(self.user_with_badge, idx)
        
        self.user_with_badge.refresh_from_db()
        field_count = self.user_with_badge.recipeCount
        
        # Get count from API endpoint (which counts from DB)
        url = reverse("user-recipe-count", kwargs={"user_id": self.user_with_badge.id})
        response = self.client.get(url)
        api_count = response.data["recipe_count"]
        
        # They should match
        self.assertEqual(field_count, api_count)
        self.assertEqual(field_count, 3)
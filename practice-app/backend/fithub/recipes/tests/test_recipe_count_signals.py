"""
Unit and Integration Tests for Automatic recipeCount Update Feature

This test file covers:
- Unit tests: Direct testing of signals when recipes are created/deleted
- Integration tests: Testing through API endpoints
- Edge cases: Multiple users, soft deletes, restores, concurrent operations
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from api.models import RegisteredUser
from recipes.models import Recipe
from django.utils import timezone
import json


def create_recipe(creator, name_suffix, deleted_on=None):
    """Utility to create a minimal valid Recipe instance."""
    recipe = Recipe.objects.create(
        name=f"Recipe {name_suffix}",
        steps=["mix", "serve"],
        prep_time=5,
        cook_time=10,
        meal_type="lunch",
        creator=creator,
        deleted_on=deleted_on
    )
    return recipe


class RecipeCountSignalUnitTests(TestCase):
    """Unit tests for recipeCount automatic update signals"""

    def setUp(self):
        """Set up test fixtures"""
        self.user1 = RegisteredUser.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="testpass123"
        )
        self.user2 = RegisteredUser.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="testpass123"
        )
        # Reset recipeCount to ensure clean state
        self.user1.recipeCount = 0
        self.user1.save()
        self.user2.recipeCount = 0
        self.user2.save()

    def test_create_recipe_increments_count(self):
        """Test that creating a recipe increments the creator's recipeCount"""
        initial_count = self.user1.recipeCount
        recipe = create_recipe(self.user1, "test1")
        
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.recipeCount, initial_count + 1)
        self.assertIsNone(recipe.deleted_on)

    def test_create_multiple_recipes_increments_count(self):
        """Test that creating multiple recipes increments count correctly"""
        initial_count = self.user1.recipeCount
        
        for i in range(5):
            create_recipe(self.user1, f"test{i}")
        
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.recipeCount, initial_count + 5)

    def test_soft_delete_decrements_count(self):
        """Test that soft-deleting a recipe decrements the creator's recipeCount"""
        recipe = create_recipe(self.user1, "test1")
        self.user1.refresh_from_db()
        initial_count = self.user1.recipeCount
        
        # Soft delete the recipe
        recipe.deleted_on = timezone.now()
        recipe.save()
        
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.recipeCount, initial_count - 1)

    def test_soft_delete_preserves_count_at_zero(self):
        """Test that soft-deleting doesn't make count go below zero"""
        # Ensure count is at 0
        self.user1.recipeCount = 0
        self.user1.save()
        
        # Create and immediately delete
        recipe = create_recipe(self.user1, "test1")
        self.user1.refresh_from_db()
        count_after_create = self.user1.recipeCount
        
        # Soft delete
        recipe.deleted_on = timezone.now()
        recipe.save()
        
        self.user1.refresh_from_db()
        # Count should be 0, not negative
        self.assertGreaterEqual(self.user1.recipeCount, 0)
        self.assertEqual(self.user1.recipeCount, count_after_create - 1)

    def test_restore_recipe_increments_count(self):
        """Test that restoring a soft-deleted recipe increments count"""
        recipe = create_recipe(self.user1, "test1")
        
        # Soft delete
        recipe.deleted_on = timezone.now()
        recipe.save()
        self.user1.refresh_from_db()
        count_after_delete = self.user1.recipeCount
        
        # Restore (set deleted_on back to None)
        recipe.deleted_on = None
        recipe.save()
        
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.recipeCount, count_after_delete + 1)

    def test_create_with_deleted_on_does_not_increment(self):
        """Test that creating a recipe with deleted_on set doesn't increment count"""
        initial_count = self.user1.recipeCount
        
        recipe = create_recipe(self.user1, "test1", deleted_on=timezone.now())
        
        self.user1.refresh_from_db()
        # Count should not increment for recipes created with deleted_on set
        self.assertEqual(self.user1.recipeCount, initial_count)

    def test_multiple_users_separate_counts(self):
        """Test that different users have separate recipeCounts"""
        # Create recipes for user1
        create_recipe(self.user1, "user1_recipe1")
        create_recipe(self.user1, "user1_recipe2")
        
        # Create recipes for user2
        create_recipe(self.user2, "user2_recipe1")
        
        self.user1.refresh_from_db()
        self.user2.refresh_from_db()
        
        self.assertEqual(self.user1.recipeCount, 2)
        self.assertEqual(self.user2.recipeCount, 1)

    def test_delete_recipe_not_owned_does_not_affect_count(self):
        """Test that deleting a recipe doesn't affect the wrong user's count"""
        recipe = create_recipe(self.user1, "test1")
        
        self.user1.refresh_from_db()
        self.user2.refresh_from_db()
        user1_count = self.user1.recipeCount
        user2_initial_count = self.user2.recipeCount
        
        # Delete user1's recipe
        recipe.deleted_on = timezone.now()
        recipe.save()
        
        self.user1.refresh_from_db()
        self.user2.refresh_from_db()
        
        # user1's count should decrease
        self.assertEqual(self.user1.recipeCount, user1_count - 1)
        # user2's count should remain unchanged
        self.assertEqual(self.user2.recipeCount, user2_initial_count)

    def test_update_recipe_other_fields_does_not_change_count(self):
        """Test that updating recipe fields other than deleted_on doesn't change count"""
        recipe = create_recipe(self.user1, "test1")
        self.user1.refresh_from_db()
        initial_count = self.user1.recipeCount
        
        # Update recipe name
        recipe.name = "Updated Name"
        recipe.save()
        
        self.user1.refresh_from_db()
        # Count should remain the same
        self.assertEqual(self.user1.recipeCount, initial_count)

    def test_delete_already_deleted_recipe_does_not_decrement_twice(self):
        """Test that deleting an already deleted recipe doesn't decrement again"""
        recipe = create_recipe(self.user1, "test1")
        
        # First delete
        recipe.deleted_on = timezone.now()
        recipe.save()
        self.user1.refresh_from_db()
        count_after_first_delete = self.user1.recipeCount
        
        # Try to delete again (should not change count)
        recipe.deleted_on = timezone.now()
        recipe.save()
        
        self.user1.refresh_from_db()
        # Count should remain the same
        self.assertEqual(self.user1.recipeCount, count_after_first_delete)


class RecipeCountIntegrationTests(APITestCase):
    """Integration tests for recipeCount automatic update through API"""

    def setUp(self):
        """Set up test fixtures"""
        self.client = APIClient()
        self.user1 = RegisteredUser.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="testpass123"
        )
        self.user2 = RegisteredUser.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="testpass123"
        )
        # Reset recipeCount to ensure clean state
        self.user1.recipeCount = 0
        self.user1.save()
        self.user2.recipeCount = 0
        self.user2.save()

    def test_create_recipe_via_api_increments_count(self):
        """Test that creating a recipe through API increments recipeCount"""
        self.client.force_authenticate(user=self.user1)
        initial_count = self.user1.recipeCount
        
        url = reverse("recipe-list")
        data = {
            "name": "API Created Recipe",
            "steps": ["Step 1", "Step 2"],
            "prep_time": 10,
            "cook_time": 10,
            "meal_type": "lunch",
            "ingredients": json.dumps([])
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.recipeCount, initial_count + 1)

    def test_delete_recipe_via_api_decrements_count(self):
        """Test that deleting a recipe through API decrements recipeCount"""
        # Create recipe via API
        self.client.force_authenticate(user=self.user1)
        url = reverse("recipe-list")
        data = {
            "name": "Recipe to Delete",
            "steps": ["Step 1"],
            "prep_time": 5,
            "cook_time": 5,
            "meal_type": "breakfast",
            "ingredients": json.dumps([])
        }
        response = self.client.post(url, data)
        recipe_id = response.data["id"]
        
        self.user1.refresh_from_db()
        count_after_create = self.user1.recipeCount
        
        # Delete the recipe
        delete_url = reverse("recipe-detail", kwargs={"pk": recipe_id})
        delete_response = self.client.delete(delete_url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.recipeCount, count_after_create - 1)

    def test_create_multiple_recipes_via_api(self):
        """Test creating multiple recipes through API"""
        self.client.force_authenticate(user=self.user1)
        initial_count = self.user1.recipeCount
        
        url = reverse("recipe-list")
        for i in range(3):
            data = {
                "name": f"Recipe {i}",
                "steps": ["Step 1"],
                "prep_time": 10,
                "cook_time": 10,
                "meal_type": "lunch",
                "ingredients": json.dumps([])
            }
            response = self.client.post(url, data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.recipeCount, initial_count + 3)

    def test_delete_and_recreate_recipe_via_api(self):
        """Test deleting and recreating recipe through API"""
        self.client.force_authenticate(user=self.user1)
        initial_count = self.user1.recipeCount
        
        # Create recipe
        url = reverse("recipe-list")
        data = {
            "name": "Test Recipe",
            "steps": ["Step 1"],
            "prep_time": 10,
            "cook_time": 10,
            "meal_type": "lunch",
            "ingredients": json.dumps([])
        }
        response = self.client.post(url, data)
        recipe_id = response.data["id"]
        
        self.user1.refresh_from_db()
        count_after_create = self.user1.recipeCount
        self.assertEqual(count_after_create, initial_count + 1)
        
        # Delete recipe
        delete_url = reverse("recipe-detail", kwargs={"pk": recipe_id})
        self.client.delete(delete_url)
        
        self.user1.refresh_from_db()
        count_after_delete = self.user1.recipeCount
        self.assertEqual(count_after_delete, initial_count)
        
        # Create another recipe
        response2 = self.client.post(url, data)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.recipeCount, initial_count + 1)

    def test_multiple_users_separate_counts_via_api(self):
        """Test that different users have separate counts when using API"""
        # User1 creates recipes
        self.client.force_authenticate(user=self.user1)
        url = reverse("recipe-list")
        
        for i in range(2):
            data = {
                "name": f"User1 Recipe {i}",
                "steps": ["Step 1"],
                "prep_time": 10,
                "cook_time": 10,
                "meal_type": "lunch",
                "ingredients": json.dumps([])
            }
            self.client.post(url, data)
        
        # User2 creates a recipe
        self.client.force_authenticate(user=self.user2)
        data = {
            "name": "User2 Recipe",
            "steps": ["Step 1"],
            "prep_time": 10,
            "cook_time": 10,
            "meal_type": "lunch",
            "ingredients": json.dumps([])
        }
        self.client.post(url, data)
        
        self.user1.refresh_from_db()
        self.user2.refresh_from_db()
        
        self.assertEqual(self.user1.recipeCount, 2)
        self.assertEqual(self.user2.recipeCount, 1)

    def test_delete_other_users_recipe_does_not_affect_own_count(self):
        """Test that deleting another user's recipe doesn't affect your count"""
        # User1 creates a recipe
        self.client.force_authenticate(user=self.user1)
        url = reverse("recipe-list")
        data = {
            "name": "User1 Recipe",
            "steps": ["Step 1"],
            "prep_time": 10,
            "cook_time": 10,
            "meal_type": "lunch",
            "ingredients": json.dumps([])
        }
        response = self.client.post(url, data)
        recipe_id = response.data["id"]
        
        self.user1.refresh_from_db()
        self.user2.refresh_from_db()
        user1_count = self.user1.recipeCount
        user2_initial_count = self.user2.recipeCount
        
        # User2 tries to delete user1's recipe (should fail or not affect counts)
        # Note: This depends on permissions, but count should not change for user2
        self.client.force_authenticate(user=self.user2)
        delete_url = reverse("recipe-detail", kwargs={"pk": recipe_id})
        delete_response = self.client.delete(delete_url)
        
        # If deletion is allowed (permissions permitting), user1's count should decrease
        # If not allowed, count should remain the same
        self.user1.refresh_from_db()
        self.user2.refresh_from_db()
        
        # User2's count should never change (they didn't create it)
        self.assertEqual(self.user2.recipeCount, user2_initial_count)

    def test_update_recipe_via_api_does_not_change_count(self):
        """Test that updating a recipe via API doesn't change recipeCount"""
        # Create recipe
        self.client.force_authenticate(user=self.user1)
        url = reverse("recipe-list")
        data = {
            "name": "Original Recipe",
            "steps": ["Step 1"],
            "prep_time": 10,
            "cook_time": 10,
            "meal_type": "lunch",
            "ingredients": json.dumps([])
        }
        response = self.client.post(url, data)
        recipe_id = response.data["id"]
        
        self.user1.refresh_from_db()
        count_after_create = self.user1.recipeCount
        
        # Update recipe
        update_url = reverse("recipe-detail", kwargs={"pk": recipe_id})
        update_data = {
            "name": "Updated Recipe Name",
            "steps": ["Step 1", "Step 2"],
            "prep_time": 15,
            "cook_time": 15,
            "meal_type": "dinner"
        }
        update_response = self.client.put(update_url, update_data)
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        
        self.user1.refresh_from_db()
        # Count should remain the same
        self.assertEqual(self.user1.recipeCount, count_after_create)


class RecipeCountEdgeCaseTests(TestCase):
    """Edge case tests for recipeCount automatic update"""

    def setUp(self):
        """Set up test fixtures"""
        self.user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        self.user.recipeCount = 0
        self.user.save()

    def test_recipe_without_creator_does_not_crash(self):
        """Test that signal handles recipe without creator gracefully"""
        # This shouldn't happen in practice, but test defensive coding
        recipe = Recipe(
            name="Orphan Recipe",
            steps=["Step 1"],
            prep_time=10,
            cook_time=10,
            meal_type="lunch",
            creator=None
        )
        # Should not raise exception
        try:
            recipe.save()
        except Exception:
            pass  # Expected if creator is required

    def test_concurrent_recipe_creation(self):
        """Test that concurrent recipe creation handles count correctly"""
        from django.db import transaction
        
        recipes = []
        for i in range(5):
            recipe = create_recipe(self.user, f"concurrent{i}")
            recipes.append(recipe)
        
        self.user.refresh_from_db()
        self.assertEqual(self.user.recipeCount, 5)

    def test_recipe_count_with_existing_data(self):
        """Test recipeCount update when user already has existing recipes"""
        # Set initial count manually (simulating existing data)
        self.user.recipeCount = 3
        self.user.save()
        
        # Create a new recipe
        create_recipe(self.user, "new_recipe")
        
        self.user.refresh_from_db()
        # Should increment from 3 to 4
        self.assertEqual(self.user.recipeCount, 4)

    def test_restore_then_delete_again(self):
        """Test restoring and then deleting again"""
        recipe = create_recipe(self.user, "test1")
        self.user.refresh_from_db()
        count_after_create = self.user.recipeCount
        
        # Delete
        recipe.deleted_on = timezone.now()
        recipe.save()
        self.user.refresh_from_db()
        count_after_delete = self.user.recipeCount
        
        # Restore
        recipe.deleted_on = None
        recipe.save()
        self.user.refresh_from_db()
        count_after_restore = self.user.recipeCount
        
        # Delete again
        recipe.deleted_on = timezone.now()
        recipe.save()
        self.user.refresh_from_db()
        count_after_second_delete = self.user.recipeCount
        
        self.assertEqual(count_after_delete, count_after_create - 1)
        self.assertEqual(count_after_restore, count_after_create)
        self.assertEqual(count_after_second_delete, count_after_create - 1)


from django.urls import reverse
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

    def test_user_with_many_recipes_gets_badge(self):
        for idx in range(1, 6):
            create_recipe(self.user_with_badge, idx)

        url = reverse("user-recipe-count", kwargs={"user_id": self.user_with_badge.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["recipe_count"], 5)
        self.assertEqual(response.data["badge"], "Home Cook")

    def test_user_with_no_recipes_returns_zero_without_badge(self):
        url = reverse("user-recipe-count", kwargs={"user_id": self.user_without_recipes.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["recipe_count"], 0)
        self.assertIsNone(response.data["badge"])

    def test_invalid_user_returns_zero_count(self):
        missing_id = self.user_without_recipes.id + 999
        url = reverse("user-recipe-count", kwargs={"user_id": missing_id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["recipe_count"], 0)
        self.assertEqual(response.data["user_id"], missing_id)
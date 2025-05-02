"""Tests for the recipes app."""

from django.test import TestCase
from .models import Recipe



def test_create_recipe(self):
    """Test creating a recipe."""
    response = client.post(
        "/api/recipes/",
        {
            "title": "Test Recipe",
            "description": "This is a test recipe.",
            "ingredients": ["Ingredient 1", "Ingredient 2"],
            "instructions": ["Step 1", "Step 2"],
        },
    )
    assert response.status_code == 201
    assert response.data["title"] == "Test Recipe"
    assert response.data["description"] == "This is a test recipe."
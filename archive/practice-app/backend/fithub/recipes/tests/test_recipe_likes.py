from django.test import TestCase
from django.db import IntegrityError
from api.models import RegisteredUser
from recipes.models import Recipe, Ingredient, RecipeLike

class RecipeLikeModelTests(TestCase):

    def setUp(self):
        # Create users and recipe
        self.user = RegisteredUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="securepassword123"
        )

        self.user2 = RegisteredUser.objects.create_user(
            username="anotheruser",
            email="another@example.com",
            password="anotherpass"
        )

        self.recipe = Recipe.objects.create(
            name="Test Recipe",
            steps=["Step 1", "Step 2"],
            prep_time=5,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )

    def test_default_like_count(self):
        """
        Test that the like_count is initialized to 0 when a new recipe is created.
        """
        # Create a new recipe
        new_recipe = Recipe.objects.create(
            name="New Recipe",
            steps=["Step 1", "Step 2"],
            prep_time=5,
            cook_time=10,
            meal_type="lunch",
            creator=self.user
        )

        # Check that the like_count is initially set to 0
        self.assertEqual(new_recipe.like_count, 0)


    def test_create_recipe_like(self):
        """
        Test that a RecipeLike can be created successfully.
        """
        like = RecipeLike.objects.create(user=self.user, recipe=self.recipe)
        self.assertEqual(like.user, self.user)
        self.assertEqual(like.recipe, self.recipe)
        self.assertIsNotNone(like.created_at)
        self.assertIsNotNone(like.updated_at)  # Check that the updated_at field is set

    def test_unique_user_recipe_like(self):
        """
        Test that a user cannot like the same recipe more than once.
        """
        # First like creation
        RecipeLike.objects.create(user=self.user, recipe=self.recipe)

        # Try creating the same like again, expect IntegrityError
        with self.assertRaises(IntegrityError):
            RecipeLike.objects.create(user=self.user, recipe=self.recipe)

    def test_multiple_users_can_like_same_recipe(self):
        """
        Test that different users can like the same recipe.
        """
        RecipeLike.objects.create(user=self.user, recipe=self.recipe)
        like2 = RecipeLike.objects.create(user=self.user2, recipe=self.recipe)

        self.assertEqual(like2.recipe, self.recipe)
        self.assertEqual(like2.user, self.user2)
        self.assertEqual(self.recipe.like_count, 2)  # Check like count after second like

    def test_user_can_like_multiple_recipes(self):
        """
        Test that a user can like multiple different recipes.
        """
        another_recipe = Recipe.objects.create(
            name="Another Recipe",
            steps=["Do X", "Do Y"],
            prep_time=7,
            cook_time=12,
            meal_type="dinner",
            creator=self.user
        )

        like1 = RecipeLike.objects.create(user=self.user, recipe=self.recipe)

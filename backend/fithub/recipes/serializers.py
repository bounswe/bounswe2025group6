# recipes/serializers.py
from rest_framework import serializers
from .models import Ingredient, Recipe, RecipeIngredient, RecipeLike

class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        steps = serializers.ListField(child=serializers.CharField())

        # Explicitly declare allowed fields for creation/update
        fields = [
            'name', 'steps', 'prep_time', 'cook_time',
            'meal_type',
        ]

        # Mark read-only fields that should not be modified
        read_only_fields = [
            'id', 'like_count', 'comment_count',
            'difficulty_rating', 'taste_rating', 'health_rating',
            'difficulty_rating_count', 'taste_rating_count', 'health_rating_count',
            'is_approved', 'is_featured',
            'created_at', 'updated_at', 'deleted_on'
        ]

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'category', 'allergens', 'dietary_info']

class RecipeIngredientSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer()  # Serialize the ingredient details

    class Meta:
        model = RecipeIngredient
        fields = ['id', 'ingredient', 'quantity', 'unit']

class RecipeLikeSerializer(serializers.ModelSerializer):
    user = serializers.IntegerField(source='user.id')  # Return the user ID
    recipe = RecipeSerializer()  # Nested RecipeSerializer to show the full recipe info

    class Meta:
        model = RecipeLike
        fields = ['id', 'user', 'recipe', 'created_at', 'updated_at', 'deleted_on']

class RecipeIngredientSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer()  # Serialize the ingredient details
    recipe = RecipeSerializer()  # Serialize the recipe details

    class Meta:
        model = RecipeIngredient
        fields = ['id', 'ingredient', 'recipe', 'quantity', 'unit']


class RecipeDetailSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField()  # Or use a nested user serializer
    recipe_ingredients = RecipeIngredientSerializer(many=True, read_only=True)

    class Meta:
        model = Recipe
        fields = [
            'id', 'name', 'steps', 'prep_time', 'cook_time', 'meal_type',
            'creator', 'recipe_ingredients',
            'cost_per_serving',
            'difficulty_rating', 'taste_rating', 'health_rating',
            'like_count', 'comment_count',
            'difficulty_rating_count', 'taste_rating_count', 'health_rating_count',
            'is_approved', 'is_featured',
            'created_at', 'updated_at', 'deleted_on',
            'total_time', 'total_user_ratings', 'total_ratings'
        ]
        read_only_fields = fields  # Mark all as read-only for GET

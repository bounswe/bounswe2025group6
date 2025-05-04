# recipes/serializers.py
from rest_framework import serializers
from api.serializers import UserRegistrationSerializer
from ingredients.serializers import IngredientSerializer
from .models import Recipe, RecipeIngredient, RecipeLike

class RecipeIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeIngredient
        fields = ['ingredient', 'quantity', 'unit']

    def create(self, validated_data):
        # Extract recipe from context
        recipe = self.context.get('recipe')

        # Create the RecipeIngredient instance
        return RecipeIngredient.objects.create(recipe=recipe, **validated_data)

class RecipeSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientSerializer(many=True)  # Nested ingredients input

    class Meta:
        model = Recipe
        fields = [
            'name', 'steps', 'prep_time', 'cook_time', 'meal_type', 'ingredients'
        ]

    def create(self, validated_data):
        # Extract ingredients data from validated_data
        ingredients_data = validated_data.pop('ingredients')

        # Create the Recipe instance
        recipe = Recipe.objects.create(**validated_data)

        # Now, create the related RecipeIngredient instances
        for ingredient_data in ingredients_data:
            ingredient_data['recipe'] = recipe  # Pass the created recipe to each ingredient
            RecipeIngredientSerializer(context={'recipe': recipe}).create(ingredient_data)

        return recipe


class RecipeDetailSerializer(serializers.ModelSerializer):
    creator = UserRegistrationSerializer(read_only=True)  # Or use a nested user serializer
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

class RecipeLikeSerializer(serializers.ModelSerializer):
    user = serializers.IntegerField(source='user.id')  # Return the user ID
    recipe = RecipeSerializer()  # Nested RecipeSerializer to show the full recipe info

    class Meta:
        model = RecipeLike
        fields = ['id', 'user', 'recipe', 'created_at', 'updated_at', 'deleted_on']

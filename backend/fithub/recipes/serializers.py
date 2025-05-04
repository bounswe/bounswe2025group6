# recipes/serializers.py

import json
from rest_framework import serializers
from .models import Recipe, RecipeIngredient
from ingredients.models import Ingredient
from rest_framework.exceptions import ValidationError
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ingredients.serializers import IngredientSerializer
from rest_framework.response import Response


# Used for create request body (input)
class RecipeIngredientInputSerializer(serializers.Serializer):
    ingredient_id = serializers.IntegerField()
    quantity = serializers.FloatField()
    unit = serializers.CharField()

    def validate_ingredient_id(self, value):
        if not Ingredient.objects.filter(id=value).exists():
            raise serializers.ValidationError(f"Ingredient with ID {value} does not exist.")
        return value

# Used for create response serialization (output)
class RecipeIngredientOutputSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer()

    class Meta:
        model = RecipeIngredient
        fields = ['ingredient', 'quantity', 'unit']

# Updated RecipeSerializer
class RecipeSerializer(serializers.ModelSerializer):
    ingredients = serializers.ListField(
        child=RecipeIngredientInputSerializer(), write_only=True
    )
    ingredients_output = serializers.SerializerMethodField()
    creator = serializers.IntegerField(read_only=True)
    steps = serializers.ListField(
        child=serializers.CharField(), allow_empty=False
    )

    class Meta:
        model = Recipe
        fields = [
            'id', 'name', 'steps', 'prep_time', 'cook_time',
            'meal_type',
            'creator',             # for response (read_only)
            'ingredients',         # for request (write_only)
            'ingredients_output',  # for response (read_only)
        ]

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients')

        # Create the Recipe instance
        user = self.context['request'].user
        recipe = Recipe.objects.create(creator=user, **validated_data)


        # Loop over ingredients data to create RecipeIngredient instances
        for item in ingredients_data:
            ingredient = Ingredient.objects.get(id=item['ingredient_id'])
            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient=ingredient,
                quantity=item['quantity'],
                unit=item['unit']
            )

        return recipe

    def get_ingredients_output(self, obj):
        ingredients = RecipeIngredient.objects.filter(recipe=obj)
        return RecipeIngredientOutputSerializer(ingredients, many=True).data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['ingredients'] = data.pop('ingredients_output')  # replace output name
        return data



# Used for list view of Recipe (Response)
class RecipeListSerializer(serializers.ModelSerializer):
    creator_id = serializers.IntegerField(source='creator.id')

    class Meta:
        model = Recipe
        fields = [
            'id',
            'name',
            'meal_type',
            'creator_id',
            'prep_time',
            'cook_time',
            'cost_per_serving',
            'difficulty_rating',
            'difficulty_rating_count',
            'taste_rating',
            'taste_rating_count',
            'health_rating',
            'health_rating_count',
            'like_count',
            'comment_count',
            'is_approved',
            'is_featured',
            'total_time'  # This will be computed dynamically
        ]

# Used for detail view of Recipe (Response)
class RecipeDetailSerializer(serializers.ModelSerializer):
    alergens = serializers.SerializerMethodField()
    dietary_info = serializers.SerializerMethodField()
    creator_id = serializers.IntegerField(source='creator.id')
    ingredients = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'id',
            'name',
            'steps',
            'prep_time',
            'cook_time',
            'meal_type',
            'creator_id',
            'ingredients',
            'cost_per_serving',
            'difficulty_rating',
            'taste_rating',
            'health_rating',
            'like_count',
            'comment_count',
            'difficulty_rating_count',
            'taste_rating_count',
            'health_rating_count',
            'is_approved',
            'is_featured',
            'created_at',
            'updated_at',
            'deleted_on',
            'total_time',  # Computed dynamically
            'total_user_ratings',  # Computed dynamically
            'total_ratings',  # Computed dynamically
            'alergens',  # Dynamically returns allergens
            'dietary_info'  # Dynamically returns dietary info
        ]

    def get_ingredients(self, obj):
        ingredients = RecipeIngredient.objects.filter(recipe=obj)
        return RecipeIngredientOutputSerializer(ingredients, many=True).data

    def get_alergens(self, obj):
        return obj.check_allergens()
    def get_dietary_info(self, obj):
        return obj.check_dietary_info()



## MOCK DATA (Request, Response):

"""

{
  "name": "Pancakes",
  "steps": [
    "Mix the flour, sugar, and baking powder.",
    "Add milk and eggs, stir well.",
    "Heat a pan and cook the pancakes until golden brown on both sides."
  ],
  "prep_time": 10,
  "cook_time": 15,
  "meal_type": "breakfast",
  "ingredients": [
    {
      "ingredient_id": 1,
      "quantity": 1.5,
      "unit": "cups"
    },
    {
      "ingredient_id": 2,
      "quantity": 2,
      "unit": "pcs"
    },
    {
      "ingredient_id": 3,
      "quantity": 1,
      "unit": "cup"
    }
  ]
}

"""
"""

{
  "id": 13,
  "name": "Pancakes",
  "steps": [
    "Mix the flour, sugar, and baking powder.",
    "Add milk and eggs, stir well.",
    "Heat a pan and cook the pancakes until golden brown on both sides."
  ],
  "prep_time": 10,
  "cook_time": 15,
  "meal_type": "breakfast",
  "creator": 3,
  "ingredients": [
    {
      "ingredient": {
        "id": 1,
        "created_at": "2025-05-03T22:02:12Z",
        "updated_at": "2025-05-03T22:02:12Z",
        "deleted_on": null,
        "name": "Chicken Breast",
        "category": "proteins",
        "allergens": [],
        "dietary_info": [
          "high-protein"
        ]
      },
      "quantity": 1.5,
      "unit": "cups"
    },
    {
      "ingredient": {
        "id": 2,
        "created_at": "2025-05-03T22:02:12Z",
        "updated_at": "2025-05-03T22:02:12Z",
        "deleted_on": null,
        "name": "Salmon Fillet",
        "category": "proteins",
        "allergens": [
          "fish"
        ],
        "dietary_info": [
          "omega-3",
          "keto-friendly"
        ]
      },
      "quantity": 2,
      "unit": "pcs"
    },
    {
      "ingredient": {
        "id": 3,
        "created_at": "2025-05-03T22:02:12Z",
        "updated_at": "2025-05-03T22:02:12Z",
        "deleted_on": null,
        "name": "Ground Beef",
        "category": "proteins",
        "allergens": [],
        "dietary_info": [
          "high-protein"
        ]
      },
      "quantity": 1,
      "unit": "cup"
    }
  ]
}
"""
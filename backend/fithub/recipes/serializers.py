# recipes/serializers.py

import json
from rest_framework import serializers
from .models import Recipe, RecipeIngredient
from ingredients.models import Ingredient
from rest_framework.exceptions import ValidationError
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ingredients.serializers import IngredientSerializer
from rest_framework.pagination import PageNumberPagination
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

# Main serializer for Recipe
class RecipeSerializer(serializers.ModelSerializer):
    ingredients = serializers.ListField(
        child=RecipeIngredientInputSerializer(), write_only=True
    )
    ingredients_output = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'id', 'name', 'steps', 'prep_time', 'cook_time',
            'meal_type', 'creator',
            'ingredients',        # for request (write_only)
            'ingredients_output'  # for response (read_only)
        ]

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients')
        recipe = Recipe.objects.create(**validated_data)

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

# Used for pagination (Get endpoint)
class RecipePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'page': self.page.number,
            'page_size': self.page.paginator.per_page,
            'total': self.page.paginator.count,
            'results': data
        })



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
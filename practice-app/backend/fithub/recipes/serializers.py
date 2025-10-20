# recipes/serializers.py

from rest_framework import serializers
from .models import Recipe, RecipeIngredient
from ingredients.models import Ingredient
from rest_framework.exceptions import ValidationError
from ingredients.serializers import IngredientSerializer
from rest_framework.response import Response
import json

# Used for create response serialization (output)
class RecipeIngredientOutputSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer()

    class Meta:
        model = RecipeIngredient
        fields = ['ingredient', 'quantity', 'unit']

class RecipeIngredientOutputSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer()

    class Meta:
        model = RecipeIngredient
        fields = ['ingredient', 'quantity', 'unit']

# ============================================================
# Ingredient Output Serializer
# ============================================================
class RecipeIngredientOutputSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer()

    class Meta:
        model = RecipeIngredient
        fields = ['ingredient', 'quantity', 'unit']


# ============================================================
# 🧩 BASE SERIALIZER (only shared logic, no required model fields)
# ============================================================
class RecipeBaseSerializer(serializers.ModelSerializer):
    image_relative_url = serializers.SerializerMethodField()
    image_full_url = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True, use_url=True)
    creator = serializers.IntegerField(read_only=True)
    ingredients_output = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'id',
            'creator',
            'image',
            'image_relative_url',
            'image_full_url',
            'ingredients_output',
        ]
        read_only_fields = ['creator']

    # ---------- Shared methods ----------
    def get_image_relative_url(self, obj):
        return str(obj.image) if obj.image else None

    def get_image_full_url(self, obj):
        return obj.image.url if obj.image else None

    def get_ingredients_output(self, obj):
        ingredients = RecipeIngredient.objects.filter(recipe=obj)
        return RecipeIngredientOutputSerializer(ingredients, many=True).data

    def handle_ingredients(self, recipe, ingredients_json, clear_existing=True):
        """Shared helper for ingredient creation"""
        try:
            ingredients_data = json.loads(ingredients_json)
        except json.JSONDecodeError:
            raise serializers.ValidationError({"ingredients": "Invalid JSON format."})

        if clear_existing:
            RecipeIngredient.objects.filter(recipe=recipe).delete()

        for item in ingredients_data:
            ingredient_name = item.get('ingredient_name')
            quantity = item.get('quantity')
            unit = item.get('unit')

            if not ingredient_name:
                raise serializers.ValidationError({"ingredients": "Missing ingredient_name."})

            try:
                ingredient = Ingredient.objects.get(name=ingredient_name)
            except Ingredient.DoesNotExist:
                raise serializers.ValidationError(
                    {"ingredients": f"Ingredient '{ingredient_name}' does not exist."}
                )

            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient=ingredient,
                quantity=quantity,
                unit=unit
            )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['ingredients'] = data.pop('ingredients_output')
        return data


class RecipeCreateSerializer(RecipeBaseSerializer):
    name = serializers.CharField(required=True)
    steps = serializers.CharField(required=True)  # Accept as string, will parse in create method
    prep_time = serializers.IntegerField(required=True)
    cook_time = serializers.IntegerField(required=True)
    meal_type = serializers.ChoiceField(choices=Recipe.MEAL_TYPES, required=True)
    ingredients = serializers.CharField(
        write_only=True,
        required=True,
        help_text='JSON array of ingredients (required for create)'
    )

    class Meta(RecipeBaseSerializer.Meta):
        fields = RecipeBaseSerializer.Meta.fields + [
            'name', 'steps', 'prep_time', 'cook_time', 'meal_type', 'ingredients'
        ]

    def create(self, validated_data):
        ingredients_json = validated_data.pop('ingredients')
        steps_json = validated_data.pop('steps')
        
        # Parse steps from JSON string
        try:
            steps = json.loads(steps_json)
        except json.JSONDecodeError:
            raise serializers.ValidationError({"steps": "Invalid JSON format for steps."})
        
        user = self.context['request'].user
        recipe = Recipe.objects.create(creator=user, steps=steps, **validated_data)
        self.handle_ingredients(recipe, ingredients_json)
        return recipe

class RecipeUpdateSerializer(RecipeBaseSerializer):
    name = serializers.CharField(required=False)
    steps = serializers.CharField(required=False)  # Accept as string, will parse in update method
    prep_time = serializers.IntegerField(required=False)
    cook_time = serializers.IntegerField(required=False)
    meal_type = serializers.ChoiceField(choices=Recipe.MEAL_TYPES, required=False)
    ingredients = serializers.CharField(
        write_only=True,
        required=False,
        help_text='JSON array of ingredients (optional for update)'
    )

    class Meta(RecipeBaseSerializer.Meta):
        fields = RecipeBaseSerializer.Meta.fields + [
            'name', 'steps', 'prep_time', 'cook_time', 'meal_type', 'ingredients'
        ]

    def update(self, instance, validated_data):
        ingredients_json = validated_data.pop('ingredients', None)
        steps_json = validated_data.pop('steps', None)
        
        # Parse steps from JSON string if provided
        if steps_json:
            try:
                steps = json.loads(steps_json)
                validated_data['steps'] = steps
            except json.JSONDecodeError:
                raise serializers.ValidationError({"steps": "Invalid JSON format for steps."})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if ingredients_json:
            self.handle_ingredients(instance, ingredients_json, clear_existing=True)

        return instance

# Used for list view of Recipe (Response)
class RecipeListSerializer(serializers.ModelSerializer):
    creator_id = serializers.IntegerField(source='creator.id')

    image_relative_url = serializers.SerializerMethodField()
    image_full_url = serializers.SerializerMethodField()
    
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
            'total_time',  # This will be computed dynamically
            'image',       # for optional image upload
            'image_relative_url',  # for response (read_only)
            'image_full_url',      # for response (read_only)
        ]

    def get_image_relative_url(self, obj):
        return str(obj.image) if obj.image else None
    
    def get_image_full_url(self, obj):
        return obj.image.url if obj.image else None
    
    
# Used for detail view of Recipe (Response)
class RecipeDetailSerializer(serializers.ModelSerializer):
    alergens = serializers.SerializerMethodField()
    dietary_info = serializers.SerializerMethodField()
    creator_id = serializers.IntegerField(source='creator.id')
    ingredients = serializers.SerializerMethodField()

    image_relative_url = serializers.SerializerMethodField()
    image_full_url = serializers.SerializerMethodField()
    
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
            'dietary_info',  # Dynamically returns dietary info
            'image',  # Optional image field
            'image_relative_url',  # for response (read_only)
            'image_full_url',      # for response (read_only)
        ]

    def get_image_relative_url(self, obj):
        return str(obj.image) if obj.image else None
    
    def get_image_full_url(self, obj):
        return obj.image.url if obj.image else None
    
    def get_ingredients(self, obj):
        ingredients = RecipeIngredient.objects.filter(recipe=obj)
        return RecipeIngredientOutputSerializer(ingredients, many=True).data

    def get_alergens(self, obj):
        return obj.check_allergens()
    def get_dietary_info(self, obj):
        return obj.check_dietary_info()

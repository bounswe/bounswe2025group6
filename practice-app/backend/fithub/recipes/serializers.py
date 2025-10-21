# recipes/serializers.py

from rest_framework import serializers
from .models import Recipe, RecipeIngredient
from ingredients.models import Ingredient
from rest_framework.exceptions import ValidationError
from ingredients.serializers import IngredientSerializer
from rest_framework.response import Response
import json
from django.db import transaction

class RecipeIngredientOutputSerializer(serializers.ModelSerializer):
    ingredient = IngredientSerializer()
    costs_for_recipe = serializers.SerializerMethodField()

    class Meta:
        model = RecipeIngredient
        fields = ['ingredient', 'quantity', 'unit', 'costs_for_recipe']

    def get_costs_for_recipe(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            class DummyUser:
                preferredCurrency = "USD"
            user = DummyUser()
        return obj.get_costs(user)

# ============================================================
# 🧩 BASE SERIALIZER (only shared logic, no required model fields)
# ============================================================
class RecipeBaseSerializer(serializers.ModelSerializer):
    image_relative_url = serializers.SerializerMethodField()
    image_full_url = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True, use_url=True)
    creator = serializers.IntegerField(read_only=True)
    ingredients_output = serializers.SerializerMethodField()
    recipe_costs = serializers.SerializerMethodField()
    
    class Meta:
        model = Recipe
        fields = [
            'id',
            'creator',
            'recipe_costs',
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
        return RecipeIngredientOutputSerializer(ingredients, many=True, context=self.context).data

    def get_total_costs(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            class DummyUser:
                preferredCurrency = "USD"
            user = DummyUser()
        return obj.calculate_recipe_cost(user)
    
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
    steps = serializers.ListField(child=serializers.CharField(), required=True)
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
        user = self.context['request'].user

        try:
            with transaction.atomic():  # <- start atomic transaction
                # Create the recipe
                recipe = Recipe.objects.create(creator=user, **validated_data)

                # Parse and handle ingredients
                try:
                    ingredients_list = json.loads(ingredients_json)
                except json.JSONDecodeError:
                    raise serializers.ValidationError("Ingredients must be a valid JSON array.")

                for ing in ingredients_list:
                    ingredient_obj = Ingredient.objects.get(name=ing['ingredient_name'])
                    unit = ing['unit']
                    
                    # Optional: validate unit
                    if unit not in ingredient_obj.allowed_units:
                        raise serializers.ValidationError(
                            f"Unit '{unit}' is not allowed for ingredient '{ingredient_obj.name}'"
                        )

                    RecipeIngredient.objects.create(
                        recipe=recipe,
                        ingredient=ingredient_obj,
                        quantity=ing['quantity'],
                        unit=unit
                    )

                # Optional: calculate and save cost
                recipe.cost_per_serving = recipe.calculate_cost_per_serving(user)
                recipe.save()

                return recipe  # If all succeeds, transaction is committed

        except Exception as e:
            # Any exception will rollback all DB changes
            raise serializers.ValidationError(f"Failed to create recipe: {str(e)}")

class RecipeUpdateSerializer(RecipeBaseSerializer):
    name = serializers.CharField(required=False)
    steps = serializers.ListField(child=serializers.CharField(), required=False)
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

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if ingredients_json:
            self.handle_ingredients(instance, ingredients_json, clear_existing=True)

        return instance

# Used for list view of Recipe (Response)
class RecipeListSerializer(serializers.ModelSerializer):
    creator_id = serializers.IntegerField(source='creator.id')
    recipe_costs = serializers.SerializerMethodField()

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
            'recipe_costs',
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

    def get_recipe_costs(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            class DummyUser:
                preferredCurrency = "USD"
            user = DummyUser()
        return obj.calculate_recipe_cost(user)
    
    def get_image_relative_url(self, obj):
        return str(obj.image) if obj.image else None
    
    def get_image_full_url(self, obj):
        return obj.image.url if obj.image else None
    
    
# Used for detail view of Recipe (Response)
class RecipeDetailSerializer(serializers.ModelSerializer):
    
    allergens = serializers.SerializerMethodField()
    dietary_info = serializers.SerializerMethodField()
    creator_id = serializers.IntegerField(source='creator.id')
    ingredients = serializers.SerializerMethodField()
    recipe_costs = serializers.SerializerMethodField()

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
            'recipe_costs',  
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
            'allergens',  # Dynamically returns allergens
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
        return RecipeIngredientOutputSerializer(ingredients, many=True, context=self.context).data

    def get_allergens(self, obj):
        return obj.check_allergens()

    def get_dietary_info(self, obj):
        return obj.check_dietary_info()
    
    def get_recipe_costs(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            class DummyUser:
                preferredCurrency = "USD"
            user = DummyUser()
        return obj.calculate_recipe_cost(user)
    

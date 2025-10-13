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

class RecipeSerializer(serializers.ModelSerializer):
    # ingredients as JSON string input
    ingredients = serializers.CharField(write_only=True, required=True, help_text='JSON array of ingredients')
    
    # Cloudinary URL
    image_relative_url = serializers.SerializerMethodField()
    image_full_url = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True, use_url=True)

    # read-only fields for output
    ingredients_output = serializers.SerializerMethodField()
    creator = serializers.IntegerField(read_only=True)
    steps = serializers.ListField(child=serializers.CharField(), allow_empty=False)

    class Meta:
        model = Recipe
        fields = [
            'id', 'name', 'steps', 'prep_time', 'cook_time',
            'meal_type',
            'creator',             # for response (read_only)
            'ingredients',         # for request (write_only)
            'ingredients_output',  # for response (read_only)
            'image',               # for optional image upload
            'image_relative_url',  # for response (read_only)
            'image_full_url',      # for response (read_only)
        ]

    def create(self, validated_data):
        ingredients_json = validated_data.pop('ingredients')
        
        try:
            ingredients_data = json.loads(ingredients_json)
        except json.JSONDecodeError:
            raise serializers.ValidationError({"ingredients": "Invalid JSON format."})
            
        user = self.context['request'].user
        recipe = Recipe.objects.create(creator=user, **validated_data)

        for item in ingredients_data:
            ingredient_name = item.get('ingredient_name')
            quantity = item.get('quantity')
            unit = item.get('unit')

            try:
                ingredient = Ingredient.objects.get(name=ingredient_name)
            except Ingredient.DoesNotExist:
                raise serializers.ValidationError({"ingredients": f"Ingredient '{ingredient_name}' does not exist."})

            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient=ingredient,
                quantity=quantity,
                unit=unit
            )

        return recipe

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop('ingredients', None)

        # Update basic recipe fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if ingredients_data is not None:
            # Hard delete all existing ingredients for this recipe
            # It's a design choice to remove all ingredients and add new ones
            # This can be changed to a soft delete if needed
            # Done since o/w there will be many duplicate entries
            RecipeIngredient.objects.filter(recipe=instance).delete()

            # Add new ingredients
            for item in ingredients_data:
                ingredient_name = item['ingredient_name']

                # Check if the ingredient exists
                if not Ingredient.objects.filter(name=ingredient_name).exists():
                    raise ValidationError(f"Ingredient with name {ingredient_name} does not exist.")

                ingredient = Ingredient.objects.get(name=ingredient_name)
                RecipeIngredient.objects.create(
                    recipe=instance,
                    ingredient=ingredient,
                    quantity=item['quantity'],
                    unit=item['unit']
                )

        return instance

    def get_image_relative_url(self, obj):
        return str(obj.image) if obj.image else None

    def get_image_full_url(self, obj):
        return obj.image.url if obj.image else None
    
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

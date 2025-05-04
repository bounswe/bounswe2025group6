# recipes/serializers.py
from pyexpat import model
from rest_framework import serializers
from .models import Ingredient
from api.serializers import UserRegistrationSerializer  # Import UserSerializer from the appropriate module

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = '__all__'


# Required for the get_ingredient_id_by_name request
class IngredientNameQuerySerializer(serializers.Serializer):
    name = serializers.CharField(required=True, max_length=100)

# Required for the get_ingredient_id_by_name response
class IngredientIdSerializer(serializers.Serializer):
    class Meta:
        model = Ingredient
        fields = ['id']

# recipes/serializers.py
from rest_framework import serializers
from .models import Ingredient
from api.serializers import UserRegistrationSerializer  # Import UserSerializer from the appropriate module

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = '__all__'

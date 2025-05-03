# recipes/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from .models import Recipe
from .serializers import RecipeDetailSerializer, RecipeSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth import get_user_model


# POST /recipes/
class RecipeCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]  # Ensure user is logged in

    serializer_class = RecipeSerializer
    queryset = Recipe.objects.all()

    def perform_create(self, serializer):
        # Set the creator field from the authenticated user
        serializer.save(creator=self.request.user)

# GET /recipes/
class RecipeListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    serializer_class = RecipeSerializer

    def get_queryset(self):
        queryset = Recipe.objects.all()
        # Add optional filters here if needed, e.g. ?meal_type=lunch
        meal_type = self.request.query_params.get('meal_type')
        if meal_type:
            queryset = queryset.filter(meal_type=meal_type)
        return queryset

# GET /recipes/<id>/
class RecipeDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Recipe.objects.all()
    serializer_class = RecipeDetailSerializer

# PUT /recipes/<id>/update/
class RecipeUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]

    serializer_class = RecipeSerializer
    queryset = Recipe.objects.all()

# DELETE /recipes/<id>/delete/
class RecipeDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    queryset = Recipe.objects.all()

# GET /recipes/<id>/allergens/
class RecipeAllergensView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        recipe = get_object_or_404(Recipe, pk=pk)
        return Response({'allergens': recipe.check_allergens()})

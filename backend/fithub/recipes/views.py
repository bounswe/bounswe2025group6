# recipes/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from .models import Recipe
from .serializers import RecipeSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

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
    serializer_class = RecipeSerializer
    queryset = Recipe.objects.all()

# PUT /recipes/<id>/update/
class RecipeUpdateView(generics.UpdateAPIView):
    serializer_class = RecipeSerializer
    queryset = Recipe.objects.all()

# DELETE /recipes/<id>/delete/
class RecipeDeleteView(generics.DestroyAPIView):
    queryset = Recipe.objects.all()

# GET /recipes/<id>/allergens/
class RecipeAllergensView(generics.GenericAPIView):
    def get(self, request, pk):
        recipe = get_object_or_404(Recipe, pk=pk)
        return Response({'allergens': recipe.check_allergens()})

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Recipe, RecipeLike, Ingredient
from .serializers import RecipeSerializer, RecipeLikeSerializer, IngredientSerializer
from rest_framework.permissions import IsAuthenticated

# Recipe ViewSet to handle all Recipe related actions (CRUD)
class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Associate the creator with the logged-in user
        serializer.save(creator=self.request.user)

    def update(self, request, *args, **kwargs):
        recipe = self.get_object()
        # Ensure the logged-in user is the creator of the recipe
        if recipe.creator != self.request.user:
            return Response({"detail": "You cannot update a recipe you did not create."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

# RecipeLike API Views
class RecipeLikeViewSet(viewsets.ModelViewSet):
    queryset = RecipeLike.objects.all()
    serializer_class = RecipeLikeSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        recipe = self.get_object()  # Get the related recipe
        # Ensure that a user cannot like a recipe more than once
        if RecipeLike.objects.filter(user=self.request.user, recipe=recipe).exists():
            return Response({"detail": "You have already liked this recipe."},
                            status=status.HTTP_400_BAD_REQUEST)
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        like = self.get_object()
        # Ensure that the user can only delete their own like
        if like.user != request.user:
            return Response({"detail": "You cannot remove someone else's like."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

# Ingredient ViewSet to handle listing and retrieving ingredients
class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Ingredients can be created by the admin (or other users if applicable)
        serializer.save()

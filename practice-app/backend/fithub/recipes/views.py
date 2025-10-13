# recipes/views.py

from rest_framework.decorators import permission_classes
from rest_framework.response import Response
from rest_framework import status
from .serializers import RecipeSerializer
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from .models import Recipe
from drf_yasg import openapi
from rest_framework import viewsets
from .serializers import RecipeListSerializer, RecipeDetailSerializer
from django.utils import timezone
from .models import RecipeIngredient
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser


# Created for swagger documentation, paginate get request
pagination_params = [
    openapi.Parameter('page', openapi.IN_QUERY, description="Page number", type=openapi.TYPE_INTEGER),
    openapi.Parameter('page_size', openapi.IN_QUERY, description="Number of items per page", type=openapi.TYPE_INTEGER),
]

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

@permission_classes([IsAuthenticated])
class RecipeViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser]
    queryset = Recipe.objects.filter(deleted_on=None)  # Filter out soft-deleted recipes
    http_method_names = ['get', 'post', 'put', 'delete'] # We don't need PATCH method (PUT can also be used for partial updates)

    # Use the correct serializer class based on the action type
    def get_serializer_class(self):
        if self.action == 'list':
            return RecipeListSerializer
        elif self.action == 'retrieve':
            return RecipeDetailSerializer
        else: # For create, update, and destroy actions
            return RecipeSerializer

    # Use the custom pagination class
    pagination_class = RecipePagination

    @swagger_auto_schema(
        operation_description="Create a new recipe",
        request_body=RecipeSerializer,  # Use the correct serializer for the POST request
        responses={201: RecipeSerializer},
    )
    def create(self, request, *args, **kwargs):
        """
        Create a new recipe with ingredients (Post endpoint)
        """
        # Ensure the user is authenticated
        if not request.user.is_authenticated:
            return Response({"error": "Authentication is required."}, status=status.HTTP_401_UNAUTHORIZED)

        # Add the creator (user) to the validated data
        data = request.data.copy()
        data['creator'] = request.user.id  # Add the authenticated user's ID as the creator

        # Pass the updated data to the serializer
        serializer = self.get_serializer(data=data)

        if serializer.is_valid():
            # Create the recipe with ingredients
            recipe = serializer.save()

            # Use RecipeDetailSerializer for the created recipe response
            detailed_serializer = RecipeDetailSerializer(recipe)
            return Response(detailed_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        """
        Custom list view to handle paginated response (Get list endpoint)
        """
        page = self.paginate_queryset(self.get_queryset())
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # If no pagination required
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve detailed view of a single recipe (Get detailed endpoint)
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_description="Update an existing recipe",
        request_body=RecipeSerializer,  # Use the correct serializer for the POST request
        responses={200: RecipeSerializer},
    )
    def update(self, request, *args, **kwargs):
        """
        Update an existing recipe (Put endpoint)
        """
        instance = self.get_object()

        # Ensure the creator cannot be updated (it's tied to the user)
        data = request.data.copy()
        data['creator'] = instance.creator.id  # Re-assign the current creator ID

        # Pass the updated data to the serializer
        serializer = self.get_serializer(instance, data=data, partial=True)

        if serializer.is_valid():
            # Save the updated instance and return the response
            updated_recipe = serializer.save()
            detailed_serializer = RecipeDetailSerializer(updated_recipe)
            return Response(detailed_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete a recipe (Delete endpoint)
        """

        instance = self.get_object()

        # Object is already deleted before
        # We don't expect to be here, we use query set to filter out deleted recipes
        if instance.deleted_on:
            return Response({"detail": "Recipe not found."}, status=status.HTTP_404_NOT_FOUND)

        # Soft delete related ingredients
        RecipeIngredient.objects.filter(recipe=instance, deleted_on__isnull=True).update(deleted_on=timezone.now())

        # Soft delete the recipe
        instance.deleted_on = timezone.now()
        instance.save()

        return Response(status=status.HTTP_204_NO_CONTENT)
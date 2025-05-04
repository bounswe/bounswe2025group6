from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework import mixins, viewsets  # Import mixins and viewsets
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from .models import Ingredient  # Import the Ingredient model
from .serializers import IngredientSerializer, IngredientPagination

class IngredientViewSet(mixins.ListModelMixin,
                        mixins.RetrieveModelMixin,
                        viewsets.GenericViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    pagination_class = IngredientPagination

    # Function to get the Ingredient (all fields) by name
    @swagger_auto_schema(
        method='get',
        manual_parameters=[
            openapi.Parameter(
                'name',
                openapi.IN_QUERY,
                description="Name of the ingredient",
                type=openapi.TYPE_STRING,
                required=True
            )
        ],
        responses={200: openapi.Response(description='Ingredient object')},
    )
    @action(detail=False, methods=['get'], url_path='get-ingredient-by-name')
    def get_ingredient_by_name(self, request):
        name = request.query_params.get('name')
        if not name:
            return Response({'error': 'Query parameter "name" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        name = ' '.join(name.strip().split())  # Normalize whitespace (remove extra spaces after, before, and between words)

        try:
            ingredient = Ingredient.objects.get(name=name)
            serializer = self.serializer_class(ingredient)
            return Response(serializer.data)
        except Ingredient.DoesNotExist:
            return Response({'error': 'Ingredient not found.'}, status=status.HTTP_404_NOT_FOUND)


    # Function to get the ID of an ingredient by its name
    @swagger_auto_schema(
        method='get',
        manual_parameters=[
            openapi.Parameter(
                'name',
                openapi.IN_QUERY,
                description="Name of the ingredient",
                type=openapi.TYPE_STRING,
                required=True
            )
        ],
        responses={200: openapi.Response(description='ID of the ingredient')},
    )
    @action(detail=False, methods=['get'], url_path='get-id-by-name')
    def get_id_by_name(self, request):
        name = request.query_params.get('name')
        if not name:
            return Response({'error': 'Query parameter "name" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        name = ' '.join(name.strip().split())  # Normalize whitespace (remove extra spaces after, before, and between words)

        try:
            ingredient = Ingredient.objects.get(name=name)
            return Response({'id': ingredient.id})
        except Ingredient.DoesNotExist:
            return Response({'error': 'Ingredient not found.'}, status=status.HTTP_404_NOT_FOUND)

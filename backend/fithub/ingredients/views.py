# ingredients/views.py
from logging import Logger
from math import log
from rest_framework import viewsets
from .models import Ingredient
from .serializers import IngredientSerializer, IngredientIdSerializer, IngredientNameQuerySerializer
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.http import JsonResponse
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

class IngredientPagination(PageNumberPagination):
    page_size = 10                       # Customize the number of items per page
    page_size_query_param = 'page_size'  # Allow the client to adjust page size
    max_page_size = 100                  # Maximum number of items per page

    def get_paginated_response(self, data):
        # Get the current page and page size
        page = self.page.number
        page_size = self.page.paginator.per_page

        # Return the custom response
        return Response({
            'page': page,
            'page_size': page_size,
            'count': self.page.paginator.count,            # Total number of items
            'total_pages': self.page.paginator.num_pages,  # Total number of pages
            'results': data
        })

# Only the get method is allowed for this viewset
class IngredientViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for viewing ingredient instances.
    """
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    pagination_class = IngredientPagination

@swagger_auto_schema(
    methods=['get'],
    manual_parameters=[
        openapi.Parameter('name', openapi.IN_QUERY, description="Name of the ingredient", type=openapi.TYPE_STRING, required=True)
    ]
)
@api_view(['GET'])
def get_ingredient_id_by_name(request):
    # Validate the query parameters using the serializer
    name = request.query_params.get('name')  # Get name from query parameters
    if not name:
        return Response({'error': 'Name parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Search for the ingredient with case insensitivity
        ingredient = Ingredient.objects.get(name__iexact=name)
        # Serialize the result
        serializer = IngredientIdSerializer(ingredient)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Ingredient.DoesNotExist:
        return Response({'error': 'Ingredient not found'}, status=status.HTTP_404_NOT_FOUND)
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Ingredient
from .serializers import IngredientSerializer
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class IngredientPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        page = self.page.number
        page_size = self.page.paginator.per_page
        return Response({
            'page': page,
            'page_size': page_size,
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })

class IngredientViewSet(mixins.ListModelMixin,
                        mixins.RetrieveModelMixin,
                        viewsets.GenericViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    pagination_class = IngredientPagination

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
        name = ' '.join(name.strip().split()) # Normalize whitespace (remove extra spaces after, before, and between words)
        try:
            ingredient = Ingredient.objects.get(name=name)
            return Response({'id': ingredient.id})
        except Ingredient.DoesNotExist:
            return Response({'error': 'Ingredient not found.'}, status=status.HTTP_404_NOT_FOUND)

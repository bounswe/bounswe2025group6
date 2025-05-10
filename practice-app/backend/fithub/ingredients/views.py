from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework import mixins, viewsets
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from .models import Ingredient
from .serializers import IngredientSerializer, IngredientPagination
from wikidata.utils import get_wikidata_id, get_wikidata_details  # Import from the wikidata app

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
    
    #WIKIDATA TEST
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        ingredients_data = serializer.data

        for ingredient in ingredients_data:
            wikidata_id = get_wikidata_id(ingredient['name'])  # Assuming 'name' field
            ingredient['wikidata_id'] = wikidata_id  # Add the wikidata_id

            if wikidata_id:
                details = get_wikidata_details(wikidata_id, properties=('labels', 'descriptions', 'claims', 'P18'))
                if details:
                    #  Flatten the structure for easier use in frontend
                    ingredient['wikidata_label'] = details.get('labels', {}).get('en', {}).get('value')
                    ingredient['wikidata_description'] = details.get('descriptions', {}).get('en', {}).get('value')
                    if details.get('claims', {}).get('P18'):
                         image_filename = details['claims']['P18'][0]['mainsnak']['datavalue']['value']
                         ingredient['wikidata_image_url'] = f"https://commons.wikimedia.org/wiki/Special:FilePath/{image_filename}"
                    else:
                         ingredient['wikidata_image_url'] = None
                else:
                    ingredient['wikidata_label'] = None
                    ingredient['wikidata_description'] = None
                    ingredient['wikidata_image_url'] = None
        return self.get_paginated_response(ingredients_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        ingredient_data = serializer.data

        wikidata_id = get_wikidata_id(ingredient_data['name'])
        ingredient_data['wikidata_id'] = wikidata_id

        if wikidata_id:
            details = get_wikidata_details(wikidata_id, properties=('labels', 'descriptions', 'claims', 'P18'))
            if details:
                ingredient_data['wikidata_label'] = details.get('labels', {}).get('en', {}).get('value')
                ingredient_data['wikidata_description'] = details.get('descriptions', {}).get('en', {}).get('value')
                if details.get('claims', {}).get('P18'):
                    image_filename = details['claims']['P18'][0]['mainsnak']['datavalue']['value']
                    ingredient_data['wikidata_image_url'] = f"https://commons.wikimedia.org/wiki/Special:FilePath/{image_filename}"
                else:
                    ingredient_data['wikidata_image_url'] = None
            else:
                ingredient_data['wikidata_label'] = None
                ingredient_data['wikidata_description'] = None
                ingredient_data['wikidata_image_url'] = None
        return Response(ingredient_data)

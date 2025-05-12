from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework import mixins, viewsets
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from .models import Ingredient
from .serializers import IngredientSerializer, IngredientPagination
from wikidata.utils import get_wikidata_id, get_wikidata_details  # Import from the wikidata app
from django.utils import timezone
from datetime import timedelta
from django.core.exceptions import ObjectDoesNotExist
import logging

logger = logging.getLogger(__name__)

class IngredientViewSet(mixins.ListModelMixin,
                        mixins.RetrieveModelMixin,
                        viewsets.GenericViewSet):
    queryset = Ingredient.objects.all().order_by('name')
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
    def _update_wikidata_info(self, ingredient):
        try:
            # Only update if needed
            if not ingredient.last_wikidata_update or \
               timezone.now() - ingredient.last_wikidata_update > timedelta(hours=24):
                
                wikidata_id = get_wikidata_id(ingredient.name)
                if wikidata_id:
                    try:
                        details = get_wikidata_details(wikidata_id)
                        if details:
                            ingredient.wikidata_id = wikidata_id
                            ingredient.wikidata_label = details.get('labels', {}).get('en', {}).get('value', '')
                            ingredient.wikidata_description = details.get('descriptions', {}).get('en', {}).get('value', '')
                            
                            if 'P18' in details.get('claims', {}):
                                image = details['claims']['P18'][0]['mainsnak']['datavalue']['value']
                                ingredient.wikidata_image_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{image}"
                
                            ingredient.last_wikidata_update = timezone.now()
                            ingredient.save()
                    
                    except Exception as e:
                        logger.error(f"Error fetching Wikidata details for {ingredient.name}: {str(e)}")
        
        except Exception as e:
            logger.error(f"Error updating Wikidata info for {ingredient.name}: {str(e)}")
            # Don't raise the error - allow the API to continue working even if Wikidata fails

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            
            # Don't block the response for Wikidata updates
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in ingredient list view: {str(e)}")
            return Response(
                {"error": "An error occurred while fetching ingredients"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        self._update_wikidata_info(instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

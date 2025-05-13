from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework import mixins, viewsets
from drf_yasg import openapi
import requests
from drf_yasg.utils import swagger_auto_schema
from .models import Ingredient, WikidataInfo
from .serializers import IngredientSerializer, IngredientPagination, WikidataInfoSerializer
from wikidata.utils import get_wikidata_id, get_wikidata_details  # Import from the wikidata app
WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql"
HEADERS = {"User-Agent": "IngredientWikidataAPI/1.0"}

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


class WikidataViewSet(viewsets.ViewSet):
    @swagger_auto_schema(
        operation_description="Retrieve a list of all ingredients with their Wikidata information.",
        responses={200: openapi.Response('List of ingredients with Wikidata info', IngredientSerializer(many=True))},
        tags=["IngredientWikidata"]
    )
    @action(detail=False, methods=['get'], url_path='list-with-wikidata')
    def list_with_wikidata(self, request):
        queryset = Ingredient.objects.all()
        serializer = IngredientSerializer(queryset, many=True)
        ingredients_data = serializer.data

        for ingredient in ingredients_data:
            wikidata_info, created = WikidataInfo.objects.get_or_create(ingredient_id=ingredient['id'])

            if not wikidata_info.wikidata_id:
                wikidata_id = get_wikidata_id(ingredient['name'])
                if wikidata_id:
                    details = get_wikidata_details(wikidata_id, properties=('labels', 'descriptions', 'claims', 'P18'))
                    wikidata_info.wikidata_id = wikidata_id
                    wikidata_info.wikidata_label = details.get('labels', {}).get('en', {}).get('value')
                    wikidata_info.wikidata_description = details.get('descriptions', {}).get('en', {}).get('value')
                    if details.get('claims', {}).get('P18'):
                        image_filename = details['claims']['P18'][0]['mainsnak']['datavalue']['value']
                        wikidata_info.wikidata_image_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{image_filename}"
                    else:
                        wikidata_info.wikidata_image_url = None
                    wikidata_info.save()

            ingredient['wikidata_info'] = {
                'wikidata_id': wikidata_info.wikidata_id,
                'wikidata_label': wikidata_info.wikidata_label,
                'wikidata_description': wikidata_info.wikidata_description,
                'wikidata_image_url': wikidata_info.wikidata_image_url,
            }
        return Response(ingredients_data)

    @swagger_auto_schema(
        operation_description="Retrieve a specific ingredient by its ID along with its Wikidata information.",
        responses={
            200: openapi.Response('Ingredient with Wikidata info', IngredientSerializer()),
            404: openapi.Response('Ingredient not found')
        },
        tags=["IngredientWikidata"]
    )
    @action(detail=True, methods=['get'], url_path='retrieve-with-wikidata')
    def retrieve_with_wikidata(self, request, pk=None):
        try:
            ingredient = Ingredient.objects.get(pk=pk)
        except Ingredient.DoesNotExist:
            return Response({'error': 'Ingredient not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = IngredientSerializer(ingredient)
        ingredient_data = serializer.data

        wikidata_info, created = WikidataInfo.objects.get_or_create(ingredient_id=ingredient.id)

        if not wikidata_info.wikidata_id:
            wikidata_id = get_wikidata_id(ingredient.name)
            if wikidata_id:
                details = get_wikidata_details(wikidata_id, properties=('labels', 'descriptions', 'claims', 'P18'))
                wikidata_info.wikidata_id = wikidata_id
                wikidata_info.wikidata_label = details.get('labels', {}).get('en', {}).get('value')
                wikidata_info.wikidata_description = details.get('descriptions', {}).get('en', {}).get('value')
                if details.get('claims', {}).get('P18'):
                    image_filename = details['claims']['P18'][0]['mainsnak']['datavalue']['value']
                    wikidata_info.wikidata_image_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{image_filename}"
                else:
                    wikidata_info.wikidata_image_url = None
                wikidata_info.save()

        ingredient_data['wikidata_info'] = {
            'wikidata_id': wikidata_info.wikidata_id,
            'wikidata_label': wikidata_info.wikidata_label,
            'wikidata_description': wikidata_info.wikidata_description,
            'wikidata_image_url': wikidata_info.wikidata_image_url,
        }
        return Response(ingredient_data)



    def get_wikidata_entity(self, name):
        """Search for the Wikidata entity ID of an ingredient/meal by name."""
        response = requests.get(
            "https://www.wikidata.org/w/api.php",
            params={
                "action": "wbsearchentities",
                "search": name,
                "language": "en",
                "format": "json"
            },
            headers=HEADERS
        )
        results = response.json().get("search", [])
        if results:
            return results[0]["id"]
        return None

    def run_sparql_query(self, query):
        response = requests.get(
            WIKIDATA_SPARQL_URL,
            params={"query": query, "format": "json"},
            headers=HEADERS
        )
        return response.json()

    #ADD OTHER ENDPOINTS
    #allergens
    #description
    #label
    #nutrition
    #is-vegan
    #image
    #origin
    #category

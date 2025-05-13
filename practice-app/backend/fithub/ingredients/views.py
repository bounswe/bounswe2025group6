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
        responses={200: openapi.Response('List of ingredients with Wikidata info')},
        tags=["IngredientWikidata"]
    )
    @action(detail=False, methods=['get'], url_path='list-with-wikidata')
    def list_with_wikidata(self, request):
        ingredients = Ingredient.objects.all()
        data = []

        for ingredient in ingredients:
            # Get or create WikidataInfo for the ingredient
            wikidata_info, created = WikidataInfo.objects.get_or_create(ingredient_id=ingredient.id)

            if not wikidata_info.wikidata_id:
                # Fetch the Wikidata entity ID
                qid = self.get_wikidata_entity(ingredient.name)
                if not qid:
                    continue  # Skip if no Wikidata entity is found

                # Populate fields from Wikidata
                wikidata_info.wikidata_id = qid

                # Fetch label and description
                details_query = f"""
                SELECT ?label ?description WHERE {{
                  wd:{qid} rdfs:label ?label .
                  OPTIONAL {{ wd:{qid} schema:description ?description . }}
                  FILTER(LANG(?label) = "en" && LANG(?description) = "en")
                }}
                """
                details = self.run_sparql_query(details_query)
                for binding in details["results"]["bindings"]:
                    wikidata_info.wikidata_label = binding.get("label", {}).get("value", "")
                    wikidata_info.wikidata_description = binding.get("description", {}).get("value", "")

                # Fetch image (P18)
                image_query = f"""
                SELECT ?image WHERE {{
                  wd:{qid} wdt:P18 ?image .
                }}
                """
                image_results = self.run_sparql_query(image_query)
                if image_results["results"]["bindings"]:
                    wikidata_info.wikidata_image_url = image_results["results"]["bindings"][0]["image"]["value"]

                # Check if vegan
                vegan_query = f"""
                ASK {{
                wd:{qid} wdt:P279* wd:Q25340 .
                }}
                """
                vegan_result = self.run_sparql_query(vegan_query)
                wikidata_info.is_vegan = vegan_result.get("boolean", False)  # Default to False if no data

                # Fetch origin
                origin_query = f"""
                SELECT ?originLabel WHERE {{
                wd:{qid} wdt:P495 ?origin .
                SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
                }}
                """
                origin_results = self.run_sparql_query(origin_query)
                if origin_results["results"]["bindings"]:
                    wikidata_info.origin = origin_results["results"]["bindings"][0]["originLabel"]["value"]
                else:
                    wikidata_info.origin = None  # Default to None if no data

                # Fetch category
                category_query = f"""
                SELECT ?categoryLabel WHERE {{
                wd:{qid} wdt:P279 ?category .
                SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
                }}
                """
                category_results = self.run_sparql_query(category_query)
                if category_results["results"]["bindings"]:
                    wikidata_info.category = category_results["results"]["bindings"][0]["categoryLabel"]["value"]
                else:
                    wikidata_info.category = None  # Default to None if no data

                # Fetch allergens
                allergens_query = f"""
                SELECT ?allergenLabel WHERE {{
                wd:{qid} wdt:P2674 ?allergen .
                SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
                }}
                """
                allergens_results = self.run_sparql_query(allergens_query)
                wikidata_info.allergens = [
                    binding["allergenLabel"]["value"]
                    for binding in allergens_results["results"]["bindings"]
                ] if allergens_results["results"]["bindings"] else []

                # Fetch nutrition
                nutrition_query = f"""
                SELECT ?propertyLabel ?value WHERE {{
                VALUES ?prop {{ wdt:P2039 wdt:P3176 wdt:P2291 }}
                wd:{qid} ?prop ?value .
                SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
                ?prop rdfs:label ?propertyLabel .
                FILTER(LANG(?propertyLabel) = "en")
                }}
                """
                nutrition_results = self.run_sparql_query(nutrition_query)
                wikidata_info.nutrition = {
                    binding["propertyLabel"]["value"]: binding["value"]["value"]
                    for binding in nutrition_results["results"]["bindings"]
                } if nutrition_results["results"]["bindings"] else {}

                # Save the updated WikidataInfo
                wikidata_info.save()

            # Add the ingredient and its Wikidata info to the response
            data.append({
                "ingredient_id": ingredient.id,
                "name": ingredient.name,
                "wikidata_info": WikidataInfoSerializer(wikidata_info).data
            })

        return Response(data, status=status.HTTP_200_OK)
    

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
    
    # IMAGE ENDPOINT
    # Function to get the image of an ingredient/meal by name
    @swagger_auto_schema(
        operation_description="Get image of an ingredient/meal.",
        manual_parameters=[
            openapi.Parameter('name', openapi.IN_QUERY, description="Ingredient or meal name", type=openapi.TYPE_STRING, required=True)
        ],
        tags=["IngredientWikidata"]
    )
    @action(detail=False, methods=['get'], url_path='image')
    def image(self, request):
        name = request.query_params.get("name")
        if not name:
            return Response({'error': 'Query parameter "name" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        qid = self.get_wikidata_entity(name)
        if not qid:
            return Response({'error': 'Item not found in Wikidata.'}, status=status.HTTP_404_NOT_FOUND)

        query = f"""
        SELECT ?image WHERE {{
          wd:{qid} wdt:P18 ?image .
        }}
        """
        results = self.run_sparql_query(query)
        if results["results"]["bindings"]:
            image_name = results["results"]["bindings"][0]["image"]["value"].split("/")[-1]
            return Response({"image_url": f"https://commons.wikimedia.org/wiki/Special:FilePath/{image_name}"})
        return Response({"image_url": None})
    
    
    #ADD OTHER ENDPOINTS
    #allergens
    #description
    #label
    #nutrition
    #is-vegan
 
    #origin
    #category

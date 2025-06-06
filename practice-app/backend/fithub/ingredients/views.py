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
    
    

    @swagger_auto_schema(
        operation_description="Filter ingredients by their Wikidata description.",
        manual_parameters=[
            openapi.Parameter(
                'description',
                openapi.IN_QUERY,
                description="Wikidata description to filter ingredients by",
                type=openapi.TYPE_STRING,
                required=True
            )
        ],
        tags=["IngredientWikidata"]
    )
    @action(detail=False, methods=['get'], url_path='filter-by-description')
    def filter_by_description(self, request):
        description = request.query_params.get("description")
        if not description:
            return Response({'error': 'Query parameter "description" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Filter ingredients by their Wikidata description
        ingredients = WikidataInfo.objects.filter(wikidata_description__icontains=description)
        if not ingredients.exists():
            return Response({'error': 'No ingredients found with the specified description.'}, status=status.HTTP_404_NOT_FOUND)

        # Serialize the filtered ingredients
        serializer = WikidataInfoSerializer(ingredients, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

     # Retrieve DESCRIPTION ENDPOINT
    @swagger_auto_schema(
        operation_description="Retrieve the Wikidata description for a specific ingredient.",
        tags=["IngredientWikidata"],
        manual_parameters=[
            openapi.Parameter(
                'ingredient_id',
                openapi.IN_QUERY,
                description="The ID of the ingredient.",
                type=openapi.TYPE_INTEGER,
                required=True
            )
        ],
        responses={
            200: openapi.Response(description="Wikidata description retrieved successfully."),
            404: openapi.Response(description="Ingredient or Wikidata info not found."),
        }
    )
    @action(detail=False, methods=['get'], url_path='wikidata-description')
    def get_wikidata_description(self, request):
        ingredient_id = request.query_params.get('ingredient_id')
        if not ingredient_id:
            return Response({"error": "ingredient_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            wikidata_info = WikidataInfo.objects.get(ingredient_id=ingredient_id)
            return Response({"wikidata_description": wikidata_info.wikidata_description}, status=status.HTTP_200_OK)
        except WikidataInfo.DoesNotExist:
            return Response({"error": "Wikidata info not found for the given ingredient."}, status=status.HTTP_404_NOT_FOUND)

    @swagger_auto_schema(
        operation_description="Retrieve the category for a specific ingredient.",
        tags=["IngredientWikidata"],
        manual_parameters=[
            openapi.Parameter(
                'ingredient_id',
                openapi.IN_QUERY,
                description="The ID of the ingredient.",
                type=openapi.TYPE_INTEGER,
                required=True
            )
        ],
        responses={
            200: openapi.Response(description="Category retrieved successfully."),
            404: openapi.Response(description="Ingredient or Wikidata info not found."),
        }
    )
    @action(detail=False, methods=['get'], url_path='category')
    def get_category(self, request):
        ingredient_id = request.query_params.get('ingredient_id')
        if not ingredient_id:
            return Response({"error": "ingredient_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            wikidata_info = WikidataInfo.objects.get(ingredient_id=ingredient_id)
            return Response({"category": wikidata_info.category}, status=status.HTTP_200_OK)
        except WikidataInfo.DoesNotExist:
            return Response({"error": "Wikidata info not found for the given ingredient."}, status=status.HTTP_404_NOT_FOUND)
    
    
    @swagger_auto_schema(
        operation_description="Retrieve the Wikidata label for a specific ingredient.",
        tags=["IngredientWikidata"],
        manual_parameters=[
            openapi.Parameter(
                'ingredient_id',
                openapi.IN_QUERY,
                description="The ID of the ingredient.",
                type=openapi.TYPE_INTEGER,
                required=True
            )
        ],
        responses={
            200: openapi.Response(description="Wikidata label retrieved successfully."),
            404: openapi.Response(description="Ingredient or Wikidata info not found."),
        }
    )
    @action(detail=False, methods=['get'], url_path='wikidata-label')
    def get_wikidata_label(self, request):
        ingredient_id = request.query_params.get('ingredient_id')
        if not ingredient_id:
            return Response({"error": "ingredient_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            wikidata_info = WikidataInfo.objects.get(ingredient_id=ingredient_id)
            return Response({"wikidata_label": wikidata_info.wikidata_label}, status=status.HTTP_200_OK)
        except WikidataInfo.DoesNotExist:
            return Response({"error": "Wikidata info not found for the given ingredient."}, status=status.HTTP_404_NOT_FOUND)

    
    
    #Country of Origin Endpoint: get the origin country/cuisine of a meal 
    @swagger_auto_schema(
        operation_description="Get origin country/cuisine of a meal.",
        manual_parameters=[
            openapi.Parameter('name', openapi.IN_QUERY, description="Meal name", type=openapi.TYPE_STRING, required=True)
        ],
        tags=["IngredientWikidata"]
    )
    @action(detail=False, methods=['get'], url_path='origin')
    def origin(self, request):
        name = request.query_params.get("name")
        if not name:
            return Response({'error': 'Query parameter "name" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        qid = self.get_wikidata_entity(name)
        if not qid:
            return Response({'error': 'Item not found in Wikidata.'}, status=status.HTTP_404_NOT_FOUND)

        query = f"""
        SELECT ?originLabel WHERE {{
          wd:{qid} wdt:P495 ?origin .
          SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
        }}
        """
        results = self.run_sparql_query(query)
        origins = [binding["originLabel"]["value"] for binding in results["results"]["bindings"]]
        return Response({"origin": origins[0] if origins else None})
    
    #Filter by wikidata label
    @swagger_auto_schema(
        operation_description="Filter ingredients by their Wikidata label.",
        manual_parameters=[
            openapi.Parameter(
                'label',
                openapi.IN_QUERY,
                description="Wikidata label to filter ingredients by",
                type=openapi.TYPE_STRING,
                required=True
            )
        ],
        tags=["IngredientWikidata"]
    )
    @action(detail=False, methods=['get'], url_path='filter-by-label')
    def filter_by_label(self, request):
        label = request.query_params.get("label")
        if not label:
            return Response({'error': 'Query parameter "label" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Filter ingredients by their Wikidata label
        ingredients = WikidataInfo.objects.filter(wikidata_label__icontains=label)
        if not ingredients.exists():
            return Response({'error': 'No ingredients found with the specified label.'}, status=status.HTTP_404_NOT_FOUND)

        # Serialize the filtered ingredients
        serializer = WikidataInfoSerializer(ingredients, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_description="Retrieve Wikidata information for a specific ingredient by its name.",
        manual_parameters=[
            openapi.Parameter(
                'name',
                openapi.IN_QUERY,
                description="The name of the ingredient to retrieve information for",
                type=openapi.TYPE_STRING,
                required=True
            )
        ],
        tags=["IngredientWikidata"]
    )

    @action(detail=False, methods=['get'], url_path='retrieve-by-name')
    def retrieve_by_name(self, request):
        name = request.query_params.get("name")
        if not name:
            return Response({'error': 'Query parameter "name" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve by ingredient name
        try:
            wikidata_info = WikidataInfo.objects.get(wikidata_label__iexact=name)
            serializer = WikidataInfoSerializer(wikidata_info)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except WikidataInfo.DoesNotExist:
            return Response({'error': 'No Wikidata information found for the specified ingredient name.'}, status=status.HTTP_404_NOT_FOUND)

    







    #ADD OTHER ENDPOINTS
    
    #allergens
    #description - Celil written that.
    #label
    #nutrition
    #is-vegan
 
    
    #category

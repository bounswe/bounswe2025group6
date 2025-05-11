from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Recipe  # Assuming you have a Recipe model
from .serializers import RecipeSerializer  # Assuming you have a RecipeSerializer
from .utils import get_wikidata_id, get_wikidata_details  # Import your utility functions

class RecipeDetail(APIView):
    def get(self, request, pk):
        try:
            recipe = Recipe.objects.get(pk=pk)
            serializer = RecipeSerializer(recipe)
            recipe_data = serializer.data
            ingredients_with_details = []
            for ingredient_name in recipe_data.get('ingredients', []):  # Adjust based on your serializer
                wikidata_id = get_wikidata_id(ingredient_name)
                ingredient_info = {'name': ingredient_name, 'wikidata_id': wikidata_id}
                if wikidata_id:
                    details = get_wikidata_details(wikidata_id, properties=('labels', 'descriptions', 'claims', 'P18'))
                    if details:
                        ingredient_info['wikidata_details'] = {
                            'label': details.get('labels', {}).get('en', {}).get('value'),
                            'description': details.get('descriptions', {}).get('en', {}).get('value'),
                            'image': f"https://commons.wikimedia.org/wiki/Special:FilePath/{details['claims']['P18'][0]['mainsnak']['datavalue']['value']}" if 'P18' in details['claims'] else None,
                            # Add more details as needed
                        }
                ingredients_with_details.append(ingredient_info)
            recipe_data['ingredients_with_details'] = ingredients_with_details
            return Response(recipe_data)
        except Recipe.DoesNotExist:
            return Response({'error': 'Recipe not found'}, status=404)

# In your serializers.py, you might adjust to include the 'ingredients_with_details'
# or create a separate serializer for the detailed ingredient information.
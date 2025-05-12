from django.core.management.base import BaseCommand
from ingredients.models import Ingredient
from ingredients.views import IngredientViewSet

class Command(BaseCommand):
    help = 'Updates Wikidata information for all ingredients'

    def handle(self, *args, **kwargs):
        viewset = IngredientViewSet()
        ingredients = Ingredient.objects.all()
        total = ingredients.count()
        
        for i, ingredient in enumerate(ingredients, 1):
            self.stdout.write(f'Updating {i}/{total}: {ingredient.name}')
            viewset._update_wikidata_info(ingredient)
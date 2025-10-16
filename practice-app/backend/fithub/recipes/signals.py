from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from recipes.models import RecipeLike, RecipeIngredient
from recipes.models import Recipe

# Signal to update like_count when a new like is added
@receiver(post_save, sender=RecipeLike)
def update_like_count_on_create(sender, instance, created, **kwargs):
    if created:
        instance.recipe.like_count += 1
        instance.recipe.save(update_fields=['like_count'])

# Signal to update like_count when a like is deleted
@receiver(post_delete, sender=RecipeLike)
def update_like_count_on_delete(sender, instance, **kwargs):
    if instance.recipe.like_count > 0:
        instance.recipe.like_count -= 1
        instance.recipe.save(update_fields=['like_count'])

@receiver(post_save, sender=RecipeIngredient)
@receiver(post_delete, sender=RecipeIngredient)
def update_recipe_cost(sender, instance, **kwargs):
    recipe = instance.recipe
    recipe.cost_per_serving = recipe.calculate_cost_per_serving()
    recipe.save(update_fields=['cost_per_serving'])
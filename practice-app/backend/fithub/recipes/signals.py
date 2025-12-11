from django.db.models.signals import post_save, post_delete, pre_save
from django.db import models
from django.dispatch import receiver
from recipes.models import RecipeLike, RecipeIngredient
from recipes.models import Recipe
import threading

# Thread-local storage to track old deleted_on values across pre_save and post_save
_thread_locals = threading.local()

def get_old_deleted_on(recipe_id):
    """Get the old deleted_on value for a recipe from thread-local storage"""
    if not hasattr(_thread_locals, 'recipe_deleted_on'):
        return None
    return _thread_locals.recipe_deleted_on.get(recipe_id)

def set_old_deleted_on(recipe_id, deleted_on):
    """Store the old deleted_on value for a recipe in thread-local storage"""
    if not hasattr(_thread_locals, 'recipe_deleted_on'):
        _thread_locals.recipe_deleted_on = {}
    _thread_locals.recipe_deleted_on[recipe_id] = deleted_on

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
    # Store canonical DB value in USD so different users' preferences don't affect DB comparisons
    class _DummyUSDUser:
        preferredCurrency = "USD"
    recipe.cost_per_serving = recipe.calculate_cost_per_serving(_DummyUSDUser())
    recipe.save(update_fields=['cost_per_serving'])

@receiver(post_save, sender=RecipeIngredient)
@receiver(post_delete, sender=RecipeIngredient)
def update_recipe_nutrition(sender, instance, **kwargs):
    """Update recipe nutrition fields when ingredients are added/removed"""
    recipe = instance.recipe
    nutrition_info = recipe.calculate_nutrition_info()
    recipe.calories = nutrition_info.get('calories')
    recipe.protein = nutrition_info.get('protein')
    recipe.fat = nutrition_info.get('fat')
    recipe.carbs = nutrition_info.get('carbs')
    recipe.save(update_fields=['calories', 'protein', 'fat', 'carbs'])

# Signal to track old deleted_on value before save
@receiver(pre_save, sender=Recipe)
def track_recipe_deleted_on(sender, instance, **kwargs):
    """Track the old deleted_on value before save to detect soft deletes"""
    if instance.pk:
        try:
            old_recipe = Recipe.objects.get(pk=instance.pk)
            set_old_deleted_on(instance.pk, old_recipe.deleted_on)
        except Recipe.DoesNotExist:
            set_old_deleted_on(instance.pk, None)
    else:
        # New recipe, no old value
        set_old_deleted_on(None, None)

def get_type_of_cook_from_recipe_count(recipe_count):
    """Determine typeOfCook based on recipeCount"""
    if recipe_count >= 10:
        return 'experienced_home_cook'  # Experienced Home Cook
    elif recipe_count >= 5:
        return 'home_cook'  # Home Cook
    else:
        return 'beginner'

# Signal to update recipeCount when a recipe is created or soft-deleted
@receiver(post_save, sender=Recipe)
def update_recipe_count(sender, instance, created, **kwargs):
    """Update the creator's recipeCount and typeOfCook when a recipe is created or soft-deleted"""
    from api.models import RegisteredUser
    
    creator = instance.creator
    if not creator:
        return
    
    old_deleted_on = get_old_deleted_on(instance.pk) if instance.pk else None
    
    if created:
        # New recipe created - increment count if not soft-deleted
        if instance.deleted_on is None:
            # Update recipeCount and get the new value
            RegisteredUser.objects.filter(pk=creator.pk).update(
                recipeCount=models.F('recipeCount') + 1
            )
            # Refresh to get updated recipeCount, then update typeOfCook
            creator.refresh_from_db()
            new_type_of_cook = get_type_of_cook_from_recipe_count(creator.recipeCount)
            RegisteredUser.objects.filter(pk=creator.pk).update(
                typeOfCook=new_type_of_cook
            )
    else:
        # Existing recipe updated
        if old_deleted_on is None and instance.deleted_on is not None:
            # Recipe was just soft-deleted - decrement count
            # Ensure count doesn't go below 0
            creator.refresh_from_db()
            if creator.recipeCount > 0:
                RegisteredUser.objects.filter(pk=creator.pk).update(
                    recipeCount=models.F('recipeCount') - 1
                )
                # Update typeOfCook based on new recipeCount
                creator.refresh_from_db()
                new_type_of_cook = get_type_of_cook_from_recipe_count(creator.recipeCount)
                RegisteredUser.objects.filter(pk=creator.pk).update(
                    typeOfCook=new_type_of_cook
                )
        elif old_deleted_on is not None and instance.deleted_on is None:
            # Recipe was restored from soft-delete - increment count
            RegisteredUser.objects.filter(pk=creator.pk).update(
                recipeCount=models.F('recipeCount') + 1
            )
            # Refresh to get updated recipeCount, then update typeOfCook
            creator.refresh_from_db()
            new_type_of_cook = get_type_of_cook_from_recipe_count(creator.recipeCount)
            RegisteredUser.objects.filter(pk=creator.pk).update(
                typeOfCook=new_type_of_cook
            )
    
    # Clean up thread-local storage
    if instance.pk and hasattr(_thread_locals, 'recipe_deleted_on'):
        _thread_locals.recipe_deleted_on.pop(instance.pk, None)
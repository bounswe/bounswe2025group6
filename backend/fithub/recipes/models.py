from django.db import models
from api.models import TimestampedModel
from django.core.exceptions import ValidationError

# Ingredient model that will be used for the recipe
class Ingredient(TimestampedModel):
    # Define the ingredient categories directly in the model using choices
    CATEGORY_CHOICES = [
        ("proteins", "Proteins"),
        ("vegetables", "Vegetables"),
        ("fruits", "Fruits"),
        ("grains", "Grains"),
        ("dairy", "Dairy"),
        ("oils_and_fats", "Oils and fats"),
        ("sweeteners", "Sweeteners"),
        ("herbs_and_spices", "Herbs and spices"),
        ("sauces", "Sauces"),
        ("canned_goods", "Canned goods"),
        ("frozen_foods", "Frozen foods"),
        ("baking_essentials", "Baking essentials"),
        ("nuts_and_seeds", "Nuts and seeds"),
        ("snacks", "Snacks"),
        ("beverages", "Beverages"),
        ("other", "Other"),
    ]


    name = models.CharField(max_length=100)
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,  # Use choices from the list above
        default="other"           # Default to "other" if not specified
    )

    # Allergens and dietary info cannot be null (unless admin (blank is allowed))
    allergens = models.JSONField(default=list, blank=True)     # e.g., ["nuts", "dairy"]
    dietary_info = models.JSONField(default=list, blank=True)  # e.g., ["vegan", "gluten-free"]

    def __str__(self):
        return self.name


# Recipe model that will be used for the recipe
class Recipe(TimestampedModel):
    MEAL_TYPES = [('breakfast', 'Breakfast'), ('lunch', 'Lunch'), ('dinner', 'Dinner')]

    name = models.CharField(max_length=255, null=False, blank=False) # name cannot be null or empty ("")
    steps = models.JSONField(default=list)  # ["Chop onions", "Boil pasta"], empty list is allowed (None is not)
    prep_time = models.PositiveIntegerField(help_text="Minutes")
    cook_time = models.PositiveIntegerField(help_text="Minutes")
    cost_per_serving = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    # Rating will be initialized to null, but can be updated later
    difficulty_rating = models.FloatField(null=True, blank=True)
    taste_rating = models.FloatField(null=True, blank=True)
    health_rating = models.FloatField(null=True, blank=True)

    meal_type = models.CharField(max_length=50, choices=MEAL_TYPES)
    creator = models.ForeignKey("api.RegisteredUser", on_delete=models.CASCADE, related_name="recipes")

    is_approved = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)

    # These will be handled by the extended TimestampedModel
    # created_at
    # updated_at
    # deleted_on

    def __str__(self):
        return self.name

    # Total time will be accessible like a property
    @property
    def total_time(self):
        return self.prep_time + self.cook_time

    # Will dynamically return alergens, if updated anything no problem
    def check_allergens(self):
        return list(set(
            allergen
            for ri in self.recipe_ingredients.all()
            for allergen in ri.ingredient.allergens
        ))

    # Will dynamically return dietary info, if updated anything no problem
    def check_dietary_info(self):
        return list(set(
            info
            for ri in self.recipe_ingredients.all()
            for info in ri.ingredient.dietary_info
        ))

    def clean(self):
        """Custom clean method to validate ratings between 0 and 5."""
        for rating_field in ['difficulty_rating', 'taste_rating', 'health_rating']:
            rating_value = getattr(self, rating_field)
            if rating_value is not None:
                if rating_value < 0 or rating_value > 5:
                    raise ValidationError(f"{rating_field} must be between 0 and 5.")
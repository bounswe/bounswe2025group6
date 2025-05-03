from django.db import models
from api.models import TimestampedModel

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

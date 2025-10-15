from django.db import models
from core.models import TimestampedModel  # New import path
from decimal import Decimal

class Ingredient(TimestampedModel):
    CATEGORY_CHOICES = [
    ]

    CURRENCY_CHOICES = [
        ("USD", "USD"),
        ("TRY", "TRY"),
    ]

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="other")
    allergens = models.JSONField(default=list, blank=True)
    dietary_info = models.JSONField(default=list, blank=True)

    # Prices for 4 Turkish markets (stored in USD)
    price_A101 = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    price_SOK = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    price_BIM = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    price_MIGROS = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    base_currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="USD")

    def __str__(self):
        return self.name

    def get_prices_for_user(self, user, usd_to_try_rate=40.0):
        """
        Return prices in user's preferred currency (USD or TRY).
        Prices are stored in USD by default.
        """
        user_currency = getattr(user, "preferredCurrency", "USD")
        rate = Decimal("1.0")

        if self.base_currency == "USD" and user_currency == "TRY":
            rate = Decimal(str(usd_to_try_rate))  # convert float to Decimal
        elif self.base_currency == "TRY" and user_currency == "USD":
            rate = Decimal("1.0") / Decimal(str(usd_to_try_rate))

        def convert_into_user_currency(value):
            return round(value * rate, 2) if value is not None else None

        return {
            "currency": user_currency,
            "A101": convert_into_user_currency(self.price_A101),
            "SOK": convert_into_user_currency(self.price_SOK),
            "BIM": convert_into_user_currency(self.price_BIM),
            "MIGROS": convert_into_user_currency(self.price_MIGROS),
        }

class WikidataInfo(models.Model):
    ingredient_id = models.IntegerField(unique=True)  # Store the ID of the linked Ingredient    
    wikidata_id = models.CharField(max_length=255, null=True, blank=True)
    wikidata_label = models.CharField(max_length=255, null=True, blank=True)
    wikidata_description = models.TextField(null=True, blank=True)
    wikidata_image_url = models.URLField(null=True, blank=True)

    is_vegan = models.BooleanField(null=True, blank=True)
    origin = models.CharField(max_length=100, null=True, blank=True)
    category = models.CharField(max_length=100, null=True, blank=True)
    allergens = models.JSONField(null=True, blank=True)  # Stores list like ["gluten", "nuts"]
    nutrition = models.JSONField(null=True, blank=True)  # Example: {"calories": 50, "protein": 1.2}

    def __str__(self):
        return f"Wikidata Info for {self.ingredient.name}"


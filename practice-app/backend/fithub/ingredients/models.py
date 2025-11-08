from django.db import models
from core.models import TimestampedModel  
from decimal import Decimal
from django.core.exceptions import ValidationError

class Ingredient(TimestampedModel):
    CATEGORY_CHOICES = []

    CURRENCY_CHOICES = [("USD", "USD"), ("TRY", "TRY")]
    
    UNIT_CONVERSIONS = {
        # Volume conversions
        "l":    {"ml": 1000, "cup": 4, "tbsp": 40, "tsp": 200},
        "ml":   {"l": 1/1000, "cup": 1/250, "tbsp": 1/25, "tsp": 1/5},
        "cup":  {"ml": 250, "l": 0.250, "tbsp": 10, "tsp": 50},
        "tbsp": {"ml": 25, "l": 0.025, "cup": 1/10, "tsp": 5},
        "tsp":  {"ml": 5, "l": 0.005, "cup": 1/50, "tbsp": 1/5},

        # Weight conversions
        "kg":   {"g": 1000, "pcs": 10},       # 1 kg ≈ 10 pcs (example: 10 eggs ≈ 1 kg)
        "g":    {"kg": 1/1000, "pcs": 1/100}, # 1 pcs ≈ 100 g
        "pcs":  {"g": 100, "kg": 0.1},        # 1 pcs ≈ 100 g
    }

    POSSIBLE_UNITS =  [('pcs', 'pcs'), ('cup', 'cup'), ('tbsp', 'tbsp'), ('tsp', 'tsp'),
                        ('g', 'g'), ('kg', 'kg'), ('ml', 'ml'), ('l', 'l')]

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="other")
    allergens = models.JSONField(default=list, blank=True)
    dietary_info = models.JSONField(default=list, blank=True)
    
    # Nutrition info
    calories = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    protein = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    fat = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    carbs = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Prices for 4 Turkish markets (stored in USD)
    price_A101 = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    price_SOK = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    price_BIM = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    price_MIGROS = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    base_currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="USD")

    base_unit = models.CharField(max_length=10, choices=POSSIBLE_UNITS, default="pcs")
    base_quantity = models.DecimalField(max_digits=8, decimal_places=2, default=1.0, help_text="Quantity in base unit")

    allowed_units = models.JSONField(default=list, blank=True, help_text="List of allowed units")

    def __str__(self):
        return self.name

    def clean(self):
        if self.allowed_units:
            invalid = [u for u in self.allowed_units if u not in dict(self.POSSIBLE_UNITS)]
            if invalid:
                raise ValidationError(f"Invalid units: {invalid}")
            if self.base_unit not in self.allowed_units:
                raise ValidationError("Base unit must be included in allowed_units.")

    def convert_quantity_to_base(self, quantity, unit):
        """
        Convert given quantity in specified unit to base unit quantity.
        Example: if base_unit is 'g' and quantity=5, unit='kg', returns 5000
        """
        if unit == self.base_unit:
            return Decimal(quantity)

        # Direct conversion
        if unit in self.UNIT_CONVERSIONS.get(self.base_unit, {}):
            factor = self.UNIT_CONVERSIONS[self.base_unit][unit]
            return Decimal(quantity) / Decimal(str(factor))

        # Reverse lookup (e.g., ml → cup using cup → ml)
        for u_from, mapping in self.UNIT_CONVERSIONS.items():
            if self.base_unit in mapping and u_from == unit:
                factor = mapping[self.base_unit]
                return Decimal(quantity) * Decimal(str(factor))

        raise ValidationError(f"Cannot convert from {unit} to {self.base_unit} for {self.name}")

    # Get price per base quantity (e.g., per 100g)
    def get_base_price(self, market):
        return getattr(self, f"price_{market}", None)

    def get_nutrion_info(self, quantity=1, unit=None):
        base_qty = self.convert_quantity_to_base(quantity, unit or self.base_unit)
        
        def scale(nutrient):
            if nutrient is None:
                return None
            per_unit = Decimal(nutrient) / Decimal(self.base_quantity)
            return round(per_unit * base_qty, 2)

        return {
            "calories": scale(self.calories),
            "protein": scale(self.protein),
            "fat": scale(self.fat),
            "carbs": scale(self.carbs),
        }

    # Compute cost in user’s currency for given quantity/unit
    def get_price_for_user(self, user, quantity=1, unit=None, usd_to_try_rate=40.0):
        user_currency = getattr(user, "preferredCurrency", "USD")
        rate = Decimal("1.0")
        usd_to_try_rate = Decimal(str(usd_to_try_rate))

        if self.base_currency == "USD" and user_currency == "TRY":
            rate = usd_to_try_rate
        elif self.base_currency == "TRY" and user_currency == "USD":
            rate = Decimal("1.0") / usd_to_try_rate

        base_qty = self.convert_quantity_to_base(quantity, unit or self.base_unit)

        def calc(price):
            if price is None:
                return None
            per_unit = Decimal(price) / Decimal(self.base_quantity)
            return round(per_unit * base_qty * rate, 2)

        return {
            "currency": user_currency,
            "A101": calc(self.price_A101),
            "SOK": calc(self.price_SOK),
            "BIM": calc(self.price_BIM),
            "MIGROS": calc(self.price_MIGROS),
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
        try:
            # Ingredient is defined in the same file, so we can reference it directly
            ingredient = Ingredient.objects.get(id=self.ingredient_id)
            return f"Wikidata Info for {ingredient.name}"
        except Ingredient.DoesNotExist:
            return f"Wikidata Info for ingredient_id={self.ingredient_id}"


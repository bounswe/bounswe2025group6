from django.db import models
from core.models import TimestampedModel 
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from ingredients.models import Ingredient 
from django.utils import timezone
from cloudinary.models import CloudinaryField
from decimal import Decimal

# Recipe model that will be used for the recipe
class Recipe(TimestampedModel):
    MEAL_TYPES = [('breakfast', 'Breakfast'), ('lunch', 'Lunch'), ('dinner', 'Dinner')]

    name = models.CharField(max_length=255, null=False, blank=False) # name cannot be null or empty, ("")
    steps = models.JSONField(default=list)  # ["Chop onions", "Boil pasta"], empty list is allowed (None is not)
    prep_time = models.PositiveIntegerField(help_text="Minutes")
    cook_time = models.PositiveIntegerField(help_text="Minutes")
    meal_type = models.CharField(max_length=50, choices=MEAL_TYPES)
    image = CloudinaryField('image', blank=True, null=True)
    creator = models.ForeignKey("api.RegisteredUser", on_delete=models.CASCADE, related_name="recipes")

    # Null first, will be filled with scraped data later
    cost_per_serving = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    # Rating will be initialized to null, but can be updated later
    difficulty_rating = models.FloatField(null=True, blank=True)
    taste_rating = models.FloatField(null=True, blank=True)
    health_rating = models.FloatField(null=True, blank=True)

    # Like count
    like_count = models.PositiveIntegerField(default=0)

    # Comment count
    comment_count = models.PositiveIntegerField(default=0)

    # Rate count
    difficulty_rating_count = models.PositiveIntegerField(default=0)
    taste_rating_count = models.PositiveIntegerField(default=0)
    health_rating_count = models.PositiveIntegerField(default=0)

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
        return (self.prep_time or 0) + (self.cook_time or 0)

    # Total user ratings will be accessible like a property
    @property
    def total_user_ratings(self):
        return (self.difficulty_rating_count or 0) + (self.taste_rating_count or 0)

    # Total ratings will be accessible like a property
    @property
    def total_ratings(self):
        return (self.difficulty_rating or 0) + (self.taste_rating or 0) + (self.health_rating or 0)

    def clean(self):
        """Custom clean method to validate ratings between 0 and 5."""
        # Validate ratings if they are not None
        for rating_field in ['difficulty_rating', 'taste_rating', 'health_rating']:
            rating_value = getattr(self, rating_field)
            if rating_value is not None:
                if rating_value < 0 or rating_value > 5:
                    raise ValidationError(f"{rating_field} must be between 0 and 5.")


    # Crutial for soft delete (also affects the recipeIngredient cascade delete)
    def delete(self, *args, **kwargs):
        if self.deleted_on: # Fixes the issue of deleting already deleted recipes
            return  # Already deleted
        self.deleted_on = timezone.now()
        self.save()

    def calculate_recipe_cost(self, user):
        """
        Calculates the recipe cost of the recipe for each market.
        """
        recipe_costs = {'price_A101': Decimal("0.0"),
                      'price_SOK': Decimal("0.0"),
                      'price_BIM': Decimal("0.0"),
                      'price_MIGROS': Decimal("0.0")}
        
        for ri in self.recipe_ingredients.all():
            ingredient = ri.ingredient
            quantity = Decimal(ri.quantity)
            base_qty = Decimal(ingredient.base_quantity)

            # Cheapest price among markets
            prices = [
                Decimal(ingredient.price_A101),
                Decimal(ingredient.price_SOK),
                Decimal(ingredient.price_BIM),
                Decimal(ingredient.price_MIGROS),
            ]
            
            # Scale by quantity relative to base
            for price in prices:
                cost_for_ri = price * (quantity / base_qty)
                if price == Decimal(ingredient.price_A101):
                    recipe_costs['price_A101'] += cost_for_ri
                elif price == Decimal(ingredient.price_SOK):
                    recipe_costs['price_SOK'] += cost_for_ri
                elif price == Decimal(ingredient.price_BIM):
                    recipe_costs['price_BIM'] += cost_for_ri
                elif price == Decimal(ingredient.price_MIGROS):
                    recipe_costs['price_MIGROS'] += cost_for_ri

        return {market: cost.quantize(Decimal("0.01")) for market, cost in recipe_costs.items()}

    def calculate_cost_per_serving(self, user=None):
        """
        Saves the minimum cost per serving among markets to the recipe's cost_per_serving field.
        """
        total_cost = Decimal("0.0")

        if user is None:
            class DummyUser:
                preferredCurrency = "USD"
            user = DummyUser()

        market_costs = self.calculate_recipe_cost(user=user)
        print("DEBUG: Market costs calculated:", market_costs)
        if market_costs:
            total_cost = min(market_costs.values())
            print("DEBUG: Minimum cost per serving:", total_cost)
        return total_cost.quantize(Decimal("0.01"))

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


    #added to update relevant rating types after users provide ratings
    def update_ratings(self, rating_type, rating_value):
        """
        Update the appropriate rating and the rating count.
        """
        if rating_type == 'difficulty':
            if self.difficulty_rating is None:
                self.difficulty_rating = rating_value
            else:
                # Recalculate the average
                self.difficulty_rating = ((self.difficulty_rating * self.difficulty_rating_count) + rating_value) / (self.difficulty_rating_count + 1)
            self.difficulty_rating_count += 1

        elif rating_type == 'taste':
            if self.taste_rating is None:
                self.taste_rating = rating_value
            else:
                self.taste_rating = ((self.taste_rating * self.taste_rating_count) + rating_value) / (self.taste_rating_count + 1)
            self.taste_rating_count += 1

        elif rating_type == 'health':
            if self.health_rating is None:
                self.health_rating = rating_value
            else:
                self.health_rating = ((self.health_rating * self.health_rating_count) + rating_value) / (self.health_rating_count + 1)
            self.health_rating_count += 1

        self.save()

    def drop_rating(self, rating_type, rating_value):
        """
        Remove a rating from the calculated totals before updating
        """
        if rating_type == 'difficulty' and self.difficulty_rating is not None:
            if self.difficulty_rating_count == 1:
                self.difficulty_rating = None
            else:
                self.difficulty_rating = ((self.difficulty_rating * self.difficulty_rating_count) - rating_value) / (self.difficulty_rating_count - 1)
            self.difficulty_rating_count -= 1

        elif rating_type == 'taste' and self.taste_rating is not None:
            if self.taste_rating_count == 1:
                self.taste_rating = None
            else:
                self.taste_rating = ((self.taste_rating * self.taste_rating_count) - rating_value) / (self.taste_rating_count - 1)
            self.taste_rating_count -= 1

        self.save()

# RecipeIngredient model that will be used for the recipe (holds the relationship between Recipe and Ingredient)
# Many-to-many relationship
class RecipeIngredient(TimestampedModel):
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    recipe = models.ForeignKey("Recipe", related_name="recipe_ingredients", on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(Decimal("0.001"))])
    unit = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.quantity} {self.unit} {self.ingredient.name}"

    def clean(self):
        if self.unit not in (self.ingredient.allowed_units or []):
            raise ValidationError(f"Invalid unit '{self.unit}' for ingredient '{self.ingredient.name}'")

    def get_costs(self, user, usd_to_try_rate=40.0):
        """Return cost dict (A101, SOK, BIM, MIGROS) for this ingredient usage."""
        return self.ingredient.get_price_for_user(
            user=user,
            quantity=self.quantity,
            unit=self.unit,
            usd_to_try_rate=usd_to_try_rate,
        )
    
# RecipeLike model that will be used for the recipe
class RecipeLike(TimestampedModel):
    recipe = models.ForeignKey(Recipe, related_name="likes", on_delete=models.CASCADE)
    user = models.ForeignKey("api.RegisteredUser", on_delete=models.CASCADE)

    class Meta:
        unique_together = ('recipe', 'user')

    def __str__(self):
        return f"{self.user.username} liked {self.recipe.name}"
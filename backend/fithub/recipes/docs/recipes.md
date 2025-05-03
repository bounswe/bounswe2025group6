```python
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

```

```python
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
        # Validate ratings if they are not None
        for rating_field in ['difficulty_rating', 'taste_rating', 'health_rating']:
            rating_value = getattr(self, rating_field)
            if rating_value is not None:
                if rating_value < 0 or rating_value > 5:
                    raise ValidationError(f"{rating_field} must be between 0 and 5.")
```

```python
class RecipeIngredient(TimestampedModel):
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    recipe = models.ForeignKey("Recipe", related_name="recipe_ingredients", on_delete=models.CASCADE)
    quantity = models.FloatField()          # 100.0
    unit = models.CharField(max_length=20)  # g, ml, pcs

    def __str__(self):
        return f"{self.quantity} {self.unit} {self.ingredient.name}"
```

```python
class RecipeMedia(TimestampedModel):
    recipe = models.ForeignKey(Recipe, related_name="media", on_delete=models.CASCADE)
    file = models.FileField(upload_to="media/recipes/")
    file_type = models.CharField(max_length=20, choices=[('image', 'Image'), ('video', 'Video')])
```

```python
class RecipeComment(TimestampedModel):
    recipe = models.ForeignKey(Recipe, related_name="comments", on_delete=models.CASCADE)
    user = models.ForeignKey("api.RegisteredUser", on_delete=models.CASCADE)
    text = models.TextField()

    def __str__(self):
        return f"{self.user.username} on {self.recipe.name}"
```

```python
class RecipeLike(TimestampedModel):
    recipe = models.ForeignKey(Recipe, related_name="likes", on_delete=models.CASCADE)
    user = models.ForeignKey("api.RegisteredUser", on_delete=models.CASCADE)

    class Meta:
        unique_together = ('recipe', 'user')
```

```python
class RecipeRating(TimestampedModel):
    RATING_TYPES = [('taste', 'Taste'), ('difficulty', 'Difficulty'), ('health', 'Health')]

    recipe = models.ForeignKey(Recipe, related_name="ratings", on_delete=models.CASCADE)
    user = models.ForeignKey("api.RegisteredUser", on_delete=models.CASCADE)
    rating_type = models.CharField(max_length=20, choices=RATING_TYPES)
    value = models.IntegerField()  # 0–5

    class Meta:
        unique_together = ('recipe', 'user', 'rating_type')

    def clean(self):
        if self.rating_type == 'health' and not self.user.groups.filter(name='Dietitian').exists():
            raise ValidationError("Only dietitians can rate health.")
```


### Endpoints

#### 📦 Recipe Endpoints

- POST /recipes/ – create new recipe

- PUT /recipes/<id>/ – update recipe

- GET /recipes – filtered get

- GET /recipes/<id>/ – get recipe details

- GET /recipes/<id>/allergens/ – get all allergens for a recipe (optional, can be obtained with detailed get)

- DELETE /recipes/<id>/ – delete recipe

#### 💬 Recipe Comments Endpoints

- POST /recipes/<id>/comments/ - add comment

- GET /recipes/<id>/comments/ – filtered get

- GET /recipes/<id>/comments/<comment_id>/ – get comment details

- DELETE /recipes/<id>/comments/<comment_id>/ – delete comment

- **Comments Note:** A comment cannot be edited, only deleted and re-added. Only the creator can delete their own comment.

#### ❤️ Recipe Like Endpoints

- POST /recipes/<id>/toggle_like/ – like/unlike recipe

#### ⭐ Recipe Rate Endpoints

- POST /recipes/<id>/rate/ – rate recipe

- PUT /recipes/<id>/rate/ – update rating

- DELETE /recipes/<id>/rate/ – delete rating

- **Rating Note:** A user can only rate a recipe once. Can only rate an integer between 0-5. Health rating can only be given by dietitian

- **General Note:** A post can be liked/unliked, rated, commented

### ✅ Serializer Tips
Use NestedSerializers for RecipeIngredient to return ingredient + quantity/unit

Use SlugRelatedField or custom serializers for creator, media_files, etc.

### ✅ Advanced Suggestions
Filtering & Search
Use django-filter + DRF's SearchFilter for filtering & searching recipes by ingredients, meal type, rating, etc.

Permissions
Ensure only creators or admins can edit/delete recipes. Use IsAuthenticatedOrReadOnly + custom permissions.

Ratings Aggregation
Use fields like total_ratings, rating_count to compute average on update, or compute dynamically with @property.

Validation
Enforce validation rules like required fields, minimum ratings (0-5), acceptable units, etc. via serializer validation methods.

### ✅ Optional Add-ons
Allergy Alerts: add a method on Recipe to scan all ingredients’ allergens field and return potential risks.

Favorites: allow users to favorite recipes via ManyToMany.

Pagination: for recipe list responses.

Moderation: is_approved field for admin control.

Feature recipes: is_featured for home page curation.

#### Notes:
- Keep ratings tied to users so only one rating per user per recipe exists.
- Only the creator can delete their comment.
- Return flags like has_liked, user_rating, can_edit in recipe detail responses for the frontend to adjust UI.

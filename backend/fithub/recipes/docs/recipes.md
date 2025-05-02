```python
class Ingredient(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    allergens = models.JSONField(default=list)  # or ManyToManyField(Allergen)
    dietary_info = models.JSONField(default=list)  # e.g., ["vegan", "gluten-free"]

    def __str__(self):
        return self.name

```

```python
class RecipeIngredient(models.Model):
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    recipe = models.ForeignKey("Recipe", related_name="recipe_ingredients", on_delete=models.CASCADE)
    quantity = models.FloatField()
    unit = models.CharField(max_length=20)  # g, ml, pcs

    def __str__(self):
        return f"{self.quantity} {self.unit} {self.ingredient.name}"

```

```python
class Recipe(models.Model):
    MEAL_TYPES = [('breakfast', 'Breakfast'), ('lunch', 'Lunch'), ('dinner', 'Dinner'), ('snack', 'Snack')]

    name = models.CharField(max_length=255)
    steps = models.JSONField()  # e.g., ["Chop onions", "Boil pasta"]
    prep_time = models.PositiveIntegerField(help_text="Minutes")
    cook_time = models.PositiveIntegerField(help_text="Minutes")
    cost_per_serving = models.DecimalField(max_digits=6, decimal_places=2)

    difficulty_rating = models.FloatField(default=0)
    taste_rating = models.FloatField(default=0)
    health_rating = models.FloatField(default=0)

    meal_type = models.CharField(max_length=50, choices=MEAL_TYPES)
    creator = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="recipes")

    is_approved = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def total_time(self):
        return self.prep_time + self.cook_time

    def check_allergens(self):
        return list(set(
            allergen
            for ri in self.recipe_ingredients.all()
            for allergen in ri.ingredient.allergens
        ))

```

```python
class MediaFile(models.Model):
    file = models.FileField(upload_to='recipes/media/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
```

```python
class RecipeMedia(models.Model):
    recipe = models.ForeignKey(Recipe, related_name="media", on_delete=models.CASCADE)
    file = models.FileField(upload_to="recipes/")
    type = models.CharField(max_length=20, choices=[('image', 'Image'), ('video', 'Video')])
```

```python
class RecipeComment(models.Model):
    recipe = models.ForeignKey(Recipe, related_name="comments", on_delete=models.CASCADE)
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} on {self.recipe.name}"
```

```python
class RecipeLike(models.Model):
    recipe = models.ForeignKey(Recipe, related_name="likes", on_delete=models.CASCADE)
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('recipe', 'user')
```

```python
class RecipeRating(models.Model):
    RATING_TYPES = [('taste', 'Taste'), ('difficulty', 'Difficulty'), ('health', 'Health')]

    recipe = models.ForeignKey(Recipe, related_name="ratings", on_delete=models.CASCADE)
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=RATING_TYPES)
    value = models.IntegerField()  # 0–5

    class Meta:
        unique_together = ('recipe', 'user', 'type')

    def clean(self):
        if self.type == 'health' and not self.user.groups.filter(name='Dietitian').exists():
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

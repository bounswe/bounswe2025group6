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

    def __str__(self):
        return f"{self.user.username} liked {self.recipe.name}"
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



## Mock Data
Recipe Create
{
  "name": "string",
  "steps": ["step1"],
  "prep_time": 4294967295,
  "cook_time": 4294967295,
  "meal_type": "breakfast"
}
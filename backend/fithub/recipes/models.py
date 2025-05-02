from django.db import models

# Create your models here.

"""
  class Recipe {
    +id: Int
    +name: String
    +ingredients: List<Ingredient>
    +steps: List<String>
    +costPerServing: double
    +prepTime: int
    +cookTime: int
    +difficultyRating: double
    +tasteRating: double
    +healthRating: double
    +mealType: String
    +mediaFiles: List<Media>
    +comments: List<RecipeComment>
    +likes: int
    +creator: RegisteredUser
    +isApproved: boolean
    +isFeatured: boolean


    +calculateCost()
    +displaySteps()
    +checkAllergens()
    +addComment(Comment)
    +addLike()
    +removeLike()
    +updateRating(String, int)
    +searchRecipes(keyword: String): List<Recipe>
    +filterRecipes(criteria: Map<String, Object>): List<Recipe>
  }
"""

"""
  class Ingredient {
    +id: String
    +name: String # apple
    +quantity: double # 200.0
    +unit: String  # g
    +category: String
    +allergens: List<String>
    +dietaryInfo: List<String>
    +displayInfo()
    +searchIngredients(keyword: String): List<Ingredient>
    +filterIngredients(criteria: Map<String, Object>): List<Ingredient>
    +Ingredient(id: String, name: String, quantity: double, unit: String, category: String, allergens: List<String>, dietaryInfo: List<String>)
    +~Ingredient()
  }
"""

"""
MEAL_TYPES = [
        (BREAKFAST, 'Breakfast'),
        (LUNCH, 'Lunch'),
        (DINNER, 'Dinner'),
    ] """
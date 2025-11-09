from django.test import TestCase
from recipes.models import Recipe, Ingredient, RecipeIngredient
from api.models import RegisteredUser

class RecipeAllergenAndDietaryTests(TestCase):
    def setUp(self):
        self.user = RegisteredUser.objects.create(username="testuser", email="test@example.com")

        # INGREDIENTS for safe_recipe
        self.ing_safe_1 = Ingredient.objects.create(
            name="Cucumber",
            category="vegetables",
            allergens=[],
            dietary_info=["vegan", "gluten-free"],   
            allowed_units=["pcs"]                     
        )

        self.ing_safe_2 = Ingredient.objects.create(
            name="Quinoa",
            category="grains",
            allergens=[],
            dietary_info=["gluten-free", "high-protein"],
            allowed_units=["g", "kg"]                      
        )

        self.ing_safe_3 = Ingredient.objects.create(
            name="Apple",
            category="fruits",
            allergens=[],
            dietary_info=["vegan"],                 
            allowed_units=["pcs"]                  
        )
        
        # INGREDIENTS for allergen_recipe 
        self.ing_allergen_1 = Ingredient.objects.create(
            name="Peanuts",                         
            category="nuts",
            allergens=["nuts"],                     
            dietary_info=["vegan", "high-protein"], 
            allowed_units=["g", "kg"]               
        )

        self.ing_allergen_2 = Ingredient.objects.create(
            name="Whole Wheat Bread",               
            category="grains",
            allergens=["gluten"],                   
            dietary_info=[],                      
            allowed_units=["pcs"]                  
        )

        self.ing_allergen_3 = Ingredient.objects.create(
            name="Lettuce",
            category="vegetables",
            allergens=[],                          
            dietary_info=["vegan", "gluten-free"], 
            allowed_units=["pcs"]                  
        )


        # RECIPE with no allergens
        self.safe_recipe = Recipe.objects.create(
            name="Healthy Bowl",
            steps=["Mix ingredients", "Serve fresh"],
            prep_time=10,
            cook_time=0,
            meal_type="lunch",
            creator=self.user,
        )
        RecipeIngredient.objects.create(recipe=self.safe_recipe, ingredient=self.ing_safe_1, quantity=1, unit="pcs")
        RecipeIngredient.objects.create(recipe=self.safe_recipe, ingredient=self.ing_safe_2, quantity=100, unit="g")
        RecipeIngredient.objects.create(recipe=self.safe_recipe, ingredient=self.ing_safe_3, quantity=1, unit="pcs")

        # RECIPE with 3 allergens: 1 from ing_allergen_1, 2 from ing_allergen_2, 0 from ing_allergen_3
        self.allergen_recipe = Recipe.objects.create(
            name="Peanut Sandwich",
            steps=["Spread peanut butter", "Add lettuce", "Serve with bread"],
            prep_time=5,
            cook_time=0,
            meal_type="breakfast",
            creator=self.user,
        )
        RecipeIngredient.objects.create(recipe=self.allergen_recipe, ingredient=self.ing_allergen_1, quantity=2, unit="pcs")
        RecipeIngredient.objects.create(recipe=self.allergen_recipe, ingredient=self.ing_allergen_2, quantity=2, unit="pcs")
        RecipeIngredient.objects.create(recipe=self.allergen_recipe, ingredient=self.ing_allergen_3, quantity=1, unit="pcs")

    def test_safe_recipe_allergens_and_dietary_info(self):
        """Ensure the safe_recipe has no allergens and 3 distinct dietary_info tags."""
        self.assertEqual(self.safe_recipe.check_allergens(), [])
        self.assertCountEqual(
            self.safe_recipe.check_dietary_info(),
            ["vegan", "gluten-free", "high-protein"]
        )

    def test_allergen_recipe_allergens_and_dietary_info(self):
        """Ensure the allergen_recipe has correct allergens and dietary info."""
        self.assertCountEqual(
            self.allergen_recipe.check_allergens(),
            ["nuts", "gluten"]
        )
        self.assertCountEqual(
            self.allergen_recipe.check_dietary_info(),
            ["vegan", "gluten-free", "high-protein"]
        )

    def test_empty_recipe_has_no_allergens_or_dietary_info(self):
        empty_recipe = Recipe.objects.create(
            name="Empty Dish",
            steps=[],
            prep_time=0,
            cook_time=0,
            meal_type="dinner",
            creator=self.user,
        )
        self.assertEqual(empty_recipe.check_allergens(), [])
        self.assertEqual(empty_recipe.check_dietary_info(), [])

    def test_duplicate_allergens_and_dietary_info_are_deduplicated(self):
        ingredient_dup = Ingredient.objects.create(
            name="Mixed Nuts", category="nuts_and_seeds", allergens=["nuts", "yeast"], dietary_info=["vegan"]
        )
        self.allergen_recipe.recipe_ingredients.all().delete()
        RecipeIngredient.objects.create(recipe=self.allergen_recipe, ingredient=ingredient_dup, quantity=1, unit="pcs")
        RecipeIngredient.objects.create(recipe=self.allergen_recipe, ingredient=self.ing_allergen_1, quantity=1, unit="pcs")

        allergens = self.allergen_recipe.check_allergens()
        self.assertCountEqual(allergens, ["nuts", "yeast"])

        dietary = self.allergen_recipe.check_dietary_info()
        self.assertCountEqual(dietary, ["vegan", "high-protein"])

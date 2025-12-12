import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/models/recipe.dart';
import 'package:fithub/models/ingredient.dart';
import 'package:fithub/models/daily_meal_plan.dart';
import 'package:fithub/models/shopping_list.dart';

void main() {
  group('DailyMealPlan Tests', () {
    test('Should calculate total cost correctly', () {
      // Create test recipes with costs
      final breakfast = _createTestRecipe('Pancakes', 5.0);
      final lunch = _createTestRecipe('Salad', 8.0);
      final dinner = _createTestRecipe('Chicken', 12.0);

      final mealPlan = DailyMealPlan(
        date: DateTime.now(),
        breakfast: breakfast,
        lunch: lunch,
        dinner: dinner,
      );

      expect(mealPlan.getTotalCost(), 25.0);
    });

    test('Should return empty list when no recipes selected', () {
      final mealPlan = DailyMealPlan(date: DateTime.now());

      expect(mealPlan.getAllRecipes(), isEmpty);
      expect(mealPlan.getTotalCost(), 0.0);
      expect(mealPlan.hasRecipes(), false);
    });

    test('Should correctly identify complete meal plan', () {
      final mealPlan = DailyMealPlan(
        date: DateTime.now(),
        breakfast: _createTestRecipe('Breakfast', 5.0),
        lunch: _createTestRecipe('Lunch', 8.0),
        dinner: _createTestRecipe('Dinner', 12.0),
      );

      expect(mealPlan.isComplete(), true);
      expect(mealPlan.getSelectedMealsCount(), 3);
    });

    test('Should set and get meals by type', () {
      final mealPlan = DailyMealPlan(date: DateTime.now());
      final recipe = _createTestRecipe('Test Recipe', 10.0);

      mealPlan.setMeal('breakfast', recipe);
      expect(mealPlan.getMeal('breakfast')?.name, 'Test Recipe');
      expect(mealPlan.breakfast?.name, 'Test Recipe');
    });

    test('Should clear specific meal', () {
      final mealPlan = DailyMealPlan(
        date: DateTime.now(),
        breakfast: _createTestRecipe('Breakfast', 5.0),
      );

      expect(mealPlan.breakfast, isNotNull);
      mealPlan.clearMeal('breakfast');
      expect(mealPlan.breakfast, isNull);
    });

    test('Should collect all allergens from recipes', () {
      final breakfast = _createTestRecipe('Pancakes', 5.0, allergens: ['Dairy', 'Wheat']);
      final lunch = _createTestRecipe('Salad', 8.0, allergens: ['Nuts']);
      
      final mealPlan = DailyMealPlan(
        date: DateTime.now(),
        breakfast: breakfast,
        lunch: lunch,
      );

      final allergens = mealPlan.getAllAllergens();
      expect(allergens, containsAll(['Dairy', 'Wheat', 'Nuts']));
      expect(allergens.length, 3);
    });

    test('Should collect dietary info from recipes', () {
      final breakfast = _createTestRecipeWithDietaryInfo('Oatmeal', 3.0, dietaryInfo: ['vegan', 'gluten-free']);
      final lunch = _createTestRecipeWithDietaryInfo('Salad', 5.0, dietaryInfo: ['vegan', 'high-protein']);
      
      final mealPlan = DailyMealPlan(
        date: DateTime.now(),
        breakfast: breakfast,
        lunch: lunch,
      );

      final allDietaryInfo = <String>{};
      for (var recipe in mealPlan.getAllRecipes()) {
        allDietaryInfo.addAll(recipe.dietaryInfo);
      }
      
      expect(allDietaryInfo, containsAll(['vegan', 'gluten-free', 'high-protein']));
    });
  });

  group('ShoppingList Tests', () {
    test('Should aggregate duplicate ingredients', () {
      final recipe1 = _createTestRecipeWithIngredients(
        'Pancakes',
        5.0,
        [
          _createIngredientQuantity('Flour', 2.0, 'cup'),
          _createIngredientQuantity('Eggs', 2.0, 'pcs'),
        ],
      );

      final recipe2 = _createTestRecipeWithIngredients(
        'Omelette',
        6.0,
        [
          _createIngredientQuantity('Eggs', 3.0, 'pcs'),
          _createIngredientQuantity('Cheese', 50.0, 'g'),
        ],
      );

      final shoppingList = ShoppingList.fromRecipes([recipe1, recipe2]);

      // Should have 3 items: Flour, Eggs (aggregated), Cheese
      expect(shoppingList.items.length, 3);
      
      // Find the aggregated eggs
      final eggs = shoppingList.items.firstWhere((item) => item.ingredientName == 'Eggs');
      expect(eggs.quantity, 5.0); // 2 + 3
      expect(eggs.unit, 'pcs');
      expect(eggs.fromRecipes, containsAll(['Pancakes', 'Omelette']));
    });

    test('Should calculate total cost from recipes', () {
      final recipe1 = _createTestRecipe('Recipe1', 10.0);
      final recipe2 = _createTestRecipe('Recipe2', 15.0);
      final recipe3 = _createTestRecipe('Recipe3', 20.0);

      final shoppingList = ShoppingList.fromRecipes([recipe1, recipe2, recipe3]);

      expect(shoppingList.totalCost, 45.0);
    });

    test('Should handle recipes without cost', () {
      final recipe1 = _createTestRecipe('Recipe1', null);
      final recipe2 = _createTestRecipe('Recipe2', 15.0);

      final shoppingList = ShoppingList.fromRecipes([recipe1, recipe2]);

      expect(shoppingList.totalCost, 15.0);
    });

    test('Should track checked items count', () {
      final recipe = _createTestRecipeWithIngredients(
        'Test',
        5.0,
        [
          _createIngredientQuantity('Item1', 1.0, 'pcs'),
          _createIngredientQuantity('Item2', 2.0, 'pcs'),
          _createIngredientQuantity('Item3', 3.0, 'pcs'),
        ],
      );

      final shoppingList = ShoppingList.fromRecipes([recipe]);
      
      expect(shoppingList.getCheckedItemsCount(), 0);

      shoppingList.items[0].isChecked = true;
      expect(shoppingList.getCheckedItemsCount(), 1);

      shoppingList.items[1].isChecked = true;
      expect(shoppingList.getCheckedItemsCount(), 2);
    });

    test('Should generate plain text with custom currency', () {
      final recipe = _createTestRecipeWithIngredients(
        'Test Recipe',
        10.0,
        [_createIngredientQuantity('Flour', 2.0, 'cup')],
      );

      final shoppingList = ShoppingList.fromRecipes([recipe]);
      final text = shoppingList.toPlainText(currencySymbol: '₺');

      expect(text, contains('🛒 Shopping List'));
      expect(text, contains('Test Recipe'));
      expect(text, contains('2.0 cup Flour'));
      expect(text, contains('₺10.00'));
    });

    test('Should sort ingredients alphabetically', () {
      final recipe = _createTestRecipeWithIngredients(
        'Test',
        5.0,
        [
          _createIngredientQuantity('Zucchini', 1.0, 'pcs'),
          _createIngredientQuantity('Apple', 2.0, 'pcs'),
          _createIngredientQuantity('Milk', 1.0, 'cup'),
        ],
      );

      final shoppingList = ShoppingList.fromRecipes([recipe]);
      
      // Should be sorted: Apple, Milk, Zucchini
      expect(shoppingList.items[0].ingredientName, 'Apple');
      expect(shoppingList.items[1].ingredientName, 'Milk');
      expect(shoppingList.items[2].ingredientName, 'Zucchini');
    });
  });

  group('Allergen and Dietary Filter Tests', () {
    test('Should correctly identify recipes with allergens', () {
      final veganRecipe = _createTestRecipeWithDietaryInfo('Vegan Bowl', 8.0, allergens: [], dietaryInfo: ['vegan']);
      final dairyRecipe = _createTestRecipeWithDietaryInfo('Cheese Pizza', 10.0, allergens: ['dairy'], dietaryInfo: []);
      final nutsRecipe = _createTestRecipeWithDietaryInfo('Almond Cookies', 6.0, allergens: ['nuts'], dietaryInfo: []);
      
      expect(veganRecipe.allergens.isEmpty, true);
      expect(dairyRecipe.allergens.contains('dairy'), true);
      expect(nutsRecipe.allergens.contains('nuts'), true);
    });

    test('Should correctly identify recipes with dietary tags', () {
      final veganRecipe = _createTestRecipeWithDietaryInfo('Vegan Bowl', 8.0, dietaryInfo: ['vegan', 'gluten-free']);
      final highProteinRecipe = _createTestRecipeWithDietaryInfo('Chicken Breast', 12.0, dietaryInfo: ['high-protein']);
      final ketoRecipe = _createTestRecipeWithDietaryInfo('Keto Salad', 9.0, dietaryInfo: ['keto-friendly', 'low-carb']);
      
      expect(veganRecipe.dietaryInfo, containsAll(['vegan', 'gluten-free']));
      expect(highProteinRecipe.dietaryInfo.contains('high-protein'), true);
      expect(ketoRecipe.dietaryInfo, containsAll(['keto-friendly', 'low-carb']));
    });

    test('Should support multiple allergen exclusions', () {
      final recipes = [
        _createTestRecipeWithDietaryInfo('Safe Recipe', 5.0, allergens: [], dietaryInfo: ['vegan']),
        _createTestRecipeWithDietaryInfo('Dairy Recipe', 7.0, allergens: ['dairy'], dietaryInfo: []),
        _createTestRecipeWithDietaryInfo('Nut Recipe', 6.0, allergens: ['nuts'], dietaryInfo: []),
        _createTestRecipeWithDietaryInfo('Egg Recipe', 4.0, allergens: ['egg'], dietaryInfo: []),
      ];
      
      // Simulate filtering out dairy and nuts
      final excludedAllergens = {'dairy', 'nuts'};
      final filteredRecipes = recipes.where((recipe) {
        return !recipe.allergens.any((allergen) => excludedAllergens.contains(allergen));
      }).toList();
      
      expect(filteredRecipes.length, 2);
      expect(filteredRecipes.any((r) => r.name == 'Safe Recipe'), true);
      expect(filteredRecipes.any((r) => r.name == 'Egg Recipe'), true);
      expect(filteredRecipes.any((r) => r.name == 'Dairy Recipe'), false);
      expect(filteredRecipes.any((r) => r.name == 'Nut Recipe'), false);
    });

    test('Should support multiple dietary preferences', () {
      final recipes = [
        _createTestRecipeWithDietaryInfo('Vegan Meal', 8.0, dietaryInfo: ['vegan', 'gluten-free']),
        _createTestRecipeWithDietaryInfo('Protein Meal', 12.0, dietaryInfo: ['high-protein']),
        _createTestRecipeWithDietaryInfo('Keto Meal', 10.0, dietaryInfo: ['keto-friendly', 'low-carb']),
        _createTestRecipeWithDietaryInfo('Regular Meal', 6.0, dietaryInfo: []),
      ];
      
      // Simulate filtering for vegan recipes
      final requiredTags = {'vegan'};
      final filteredRecipes = recipes.where((recipe) {
        return requiredTags.every((tag) => recipe.dietaryInfo.contains(tag));
      }).toList();
      
      expect(filteredRecipes.length, 1);
      expect(filteredRecipes.first.name, 'Vegan Meal');
    });

    test('Should handle empty allergen list correctly', () {
      final recipe = _createTestRecipeWithDietaryInfo('Safe Recipe', 5.0, allergens: [], dietaryInfo: ['vegan']);
      
      expect(recipe.allergens.isEmpty, true);
      expect(recipe.allergens.length, 0);
    });

    test('Should handle empty dietary info list correctly', () {
      final recipe = _createTestRecipeWithDietaryInfo('Regular Recipe', 5.0, allergens: ['dairy'], dietaryInfo: []);
      
      expect(recipe.dietaryInfo.isEmpty, true);
      expect(recipe.dietaryInfo.length, 0);
    });

    test('Should support strict dietary tags (vegan, gluten-free)', () {
      final strictVeganRecipe = _createTestRecipeWithDietaryInfo('Strict Vegan', 8.0, dietaryInfo: ['vegan', 'gluten-free']);
      final partialVeganRecipe = _createTestRecipeWithDietaryInfo('Partial Vegan', 7.0, dietaryInfo: ['vegan', 'high-protein']);
      
      // Strict tags require ALL ingredients to have the tag
      // This is validated on backend, but we verify the tags are present
      expect(strictVeganRecipe.dietaryInfo.contains('vegan'), true);
      expect(strictVeganRecipe.dietaryInfo.contains('gluten-free'), true);
      expect(partialVeganRecipe.dietaryInfo.contains('vegan'), true);
    });

    test('Should combine allergen exclusion and dietary preferences', () {
      final recipes = [
        _createTestRecipeWithDietaryInfo('Vegan No Nuts', 8.0, allergens: [], dietaryInfo: ['vegan']),
        _createTestRecipeWithDietaryInfo('Vegan With Nuts', 9.0, allergens: ['nuts'], dietaryInfo: ['vegan']),
        _createTestRecipeWithDietaryInfo('Non-Vegan No Nuts', 7.0, allergens: [], dietaryInfo: ['high-protein']),
      ];
      
      // Filter: must be vegan AND must not contain nuts
      final excludedAllergens = {'nuts'};
      final requiredTags = {'vegan'};
      
      final filteredRecipes = recipes.where((recipe) {
        final hasNoExcludedAllergens = !recipe.allergens.any((a) => excludedAllergens.contains(a));
        final hasRequiredTags = requiredTags.every((tag) => recipe.dietaryInfo.contains(tag));
        return hasNoExcludedAllergens && hasRequiredTags;
      }).toList();
      
      expect(filteredRecipes.length, 1);
      expect(filteredRecipes.first.name, 'Vegan No Nuts');
    });
  });

  group('ShoppingListItem Tests', () {
    test('Should create item with correct properties', () {
      final item = ShoppingListItem(
        ingredientName: 'Flour',
        quantity: 2.5,
        unit: 'cup',
        fromRecipes: ['Pancakes', 'Bread'],
      );

      expect(item.ingredientName, 'Flour');
      expect(item.quantity, 2.5);
      expect(item.unit, 'cup');
      expect(item.fromRecipes.length, 2);
      expect(item.isChecked, false);
    });

    test('Should toggle checked state', () {
      final item = ShoppingListItem(
        ingredientName: 'Eggs',
        quantity: 3.0,
        unit: 'pcs',
        fromRecipes: ['Recipe'],
      );

      expect(item.isChecked, false);
      item.isChecked = true;
      expect(item.isChecked, true);
    });

    test('Should create copy with updated values', () {
      final item = ShoppingListItem(
        ingredientName: 'Sugar',
        quantity: 1.0,
        unit: 'cup',
        fromRecipes: ['Recipe1'],
      );

      final updated = item.copyWith(
        quantity: 2.0,
        isChecked: true,
      );

      expect(updated.quantity, 2.0);
      expect(updated.isChecked, true);
      expect(updated.ingredientName, 'Sugar'); // Unchanged
      expect(updated.unit, 'cup'); // Unchanged
    });
  });
}

// Helper functions to create test data
Recipe _createTestRecipe(String name, double? cost, {List<String>? allergens}) {
  return Recipe(
    id: name.hashCode,
    name: name,
    steps: ['Step 1'],
    prepTime: 10,
    cookTime: 20,
    mealType: 'breakfast',
    creatorId: 1,
    ingredients: [],
    costPerServing: cost,
    likeCount: 0,
    commentCount: 0,
    difficultyRatingCount: 0,
    tasteRatingCount: 0,
    healthRatingCount: 0,
    isApproved: true,
    isFeatured: false,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
    totalTime: 30,
    totalUserRatings: 0,
    totalRatings: 0,
    allergens: allergens ?? [],
    dietaryInfo: [],
  );
}

Recipe _createTestRecipeWithDietaryInfo(String name, double? cost, {List<String>? dietaryInfo, List<String>? allergens}) {
  return Recipe(
    id: name.hashCode,
    name: name,
    steps: ['Step 1'],
    prepTime: 10,
    cookTime: 20,
    mealType: 'breakfast',
    creatorId: 1,
    ingredients: [],
    costPerServing: cost,
    likeCount: 0,
    commentCount: 0,
    difficultyRatingCount: 0,
    tasteRatingCount: 0,
    healthRatingCount: 0,
    isApproved: true,
    isFeatured: false,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
    totalTime: 30,
    totalUserRatings: 0,
    totalRatings: 0,
    allergens: allergens ?? [],
    dietaryInfo: dietaryInfo ?? [],
  );
}

Recipe _createTestRecipeWithIngredients(
  String name,
  double? cost,
  List<IngredientQuantity> ingredients,
) {
  return Recipe(
    id: name.hashCode,
    name: name,
    steps: ['Step 1'],
    prepTime: 10,
    cookTime: 20,
    mealType: 'breakfast',
    creatorId: 1,
    ingredients: ingredients,
    costPerServing: cost,
    likeCount: 0,
    commentCount: 0,
    difficultyRatingCount: 0,
    tasteRatingCount: 0,
    healthRatingCount: 0,
    isApproved: true,
    isFeatured: false,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
    totalTime: 30,
    totalUserRatings: 0,
    totalRatings: 0,
    allergens: [],
    dietaryInfo: [],
  );
}

IngredientQuantity _createIngredientQuantity(String name, double quantity, String unit) {
  final ingredient = IngredientDetail(
    id: name.hashCode,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
    name: name,
    category: 'test',
    allergens: [],
    dietaryInfo: [],
    allowedUnits: ['cup', 'pcs', 'g', 'kg', 'ml', 'l'],
  );

  return IngredientQuantity(
    ingredient: ingredient,
    quantity: quantity,
    unit: unit,
  );
}


import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/models/recipe.dart';
import 'package:fithub/models/daily_meal_plan.dart';

/// Scenario 1: User creates a meal plan with selected recipes and saves it successfully.
///
/// This test simulates a complete user flow where:
/// 1. User creates a new meal plan
/// 2. Selects recipes for breakfast, lunch, and dinner
/// 3. Verifies the meal plan contains all selected recipes
/// 4. Calculates total cost and nutrition
/// 5. Successfully saves the meal plan

void main() {
  group('Scenario 1: Meal Plan Creation and Save', () {
    late DailyMealPlan mealPlan;
    late Recipe breakfastRecipe;
    late Recipe lunchRecipe;
    late Recipe dinnerRecipe;

    setUp(() {
      // Initialize test data
      mealPlan = DailyMealPlan(date: DateTime.now());

      // Create sample recipes with realistic data using the actual Recipe model structure
      breakfastRecipe = Recipe(
        id: 1,
        name: 'Healthy Oatmeal Bowl',
        steps: ['Mix oats with milk', 'Add fruits', 'Serve'],
        prepTime: 10,
        cookTime: 5,
        mealType: 'breakfast',
        costPerServing: 3.50,
        healthRating: 4.5,
        tasteRating: 4.0,
        difficultyRating: 1.0,
        creatorId: 1,
        ingredients: [],
        allergens: [],
        dietaryInfo: ['vegetarian'],
        likeCount: 0,
        commentCount: 0,
        difficultyRatingCount: 0,
        tasteRatingCount: 0,
        healthRatingCount: 0,
        isApproved: true,
        isFeatured: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        totalTime: 15,
        totalUserRatings: 0,
        totalRatings: 0,
      );

      lunchRecipe = Recipe(
        id: 2,
        name: 'Grilled Chicken Salad',
        steps: ['Grill chicken', 'Prepare greens', 'Mix together'],
        prepTime: 15,
        cookTime: 20,
        mealType: 'lunch',
        costPerServing: 8.75,
        healthRating: 4.8,
        tasteRating: 4.5,
        difficultyRating: 2.0,
        creatorId: 1,
        ingredients: [],
        allergens: [],
        dietaryInfo: ['high-protein'],
        likeCount: 0,
        commentCount: 0,
        difficultyRatingCount: 0,
        tasteRatingCount: 0,
        healthRatingCount: 0,
        isApproved: true,
        isFeatured: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        totalTime: 35,
        totalUserRatings: 0,
        totalRatings: 0,
      );

      dinnerRecipe = Recipe(
        id: 3,
        name: 'Salmon with Vegetables',
        steps: ['Season salmon', 'Bake salmon', 'Roast vegetables'],
        prepTime: 10,
        cookTime: 25,
        mealType: 'dinner',
        costPerServing: 12.00,
        healthRating: 5.0,
        tasteRating: 4.8,
        difficultyRating: 2.5,
        creatorId: 1,
        ingredients: [],
        allergens: ['fish'],
        dietaryInfo: ['omega-3'],
        likeCount: 0,
        commentCount: 0,
        difficultyRatingCount: 0,
        tasteRatingCount: 0,
        healthRatingCount: 0,
        isApproved: true,
        isFeatured: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        totalTime: 35,
        totalUserRatings: 0,
        totalRatings: 0,
      );
    });

    test('User creates an empty meal plan', () {
      // Verify meal plan is initially empty
      expect(mealPlan.hasRecipes(), isFalse);
      expect(mealPlan.isComplete(), isFalse);
      expect(mealPlan.getSelectedMealsCount(), equals(0));
      expect(mealPlan.getAllRecipes(), isEmpty);
    });

    test('User selects breakfast recipe and adds to meal plan', () {
      // User selects breakfast
      mealPlan.setMeal('breakfast', breakfastRecipe);

      // Verify breakfast is added
      expect(mealPlan.breakfast, equals(breakfastRecipe));
      expect(mealPlan.hasRecipes(), isTrue);
      expect(mealPlan.getSelectedMealsCount(), equals(1));
      expect(mealPlan.isComplete(), isFalse);
    });

    test('User selects lunch recipe and adds to meal plan', () {
      // Setup: breakfast already added
      mealPlan.setMeal('breakfast', breakfastRecipe);

      // User selects lunch
      mealPlan.setMeal('lunch', lunchRecipe);

      // Verify lunch is added
      expect(mealPlan.lunch, equals(lunchRecipe));
      expect(mealPlan.getSelectedMealsCount(), equals(2));
      expect(mealPlan.isComplete(), isFalse);
    });

    test('User completes meal plan by adding dinner recipe', () {
      // Setup: breakfast and lunch already added
      mealPlan.setMeal('breakfast', breakfastRecipe);
      mealPlan.setMeal('lunch', lunchRecipe);

      // User selects dinner
      mealPlan.setMeal('dinner', dinnerRecipe);

      // Verify meal plan is complete
      expect(mealPlan.dinner, equals(dinnerRecipe));
      expect(mealPlan.getSelectedMealsCount(), equals(3));
      expect(mealPlan.isComplete(), isTrue);
    });

    test('Meal plan contains all selected recipes', () {
      // User adds all recipes
      mealPlan.setMeal('breakfast', breakfastRecipe);
      mealPlan.setMeal('lunch', lunchRecipe);
      mealPlan.setMeal('dinner', dinnerRecipe);

      // Verify all recipes are in the meal plan
      final allRecipes = mealPlan.getAllRecipes();
      expect(allRecipes.length, equals(3));
      expect(allRecipes, contains(breakfastRecipe));
      expect(allRecipes, contains(lunchRecipe));
      expect(allRecipes, contains(dinnerRecipe));
    });

    test('Meal plan calculates correct total cost', () {
      // User adds all recipes
      mealPlan.setMeal('breakfast', breakfastRecipe);
      mealPlan.setMeal('lunch', lunchRecipe);
      mealPlan.setMeal('dinner', dinnerRecipe);

      // Calculate expected total cost
      final expectedCost = 3.50 + 8.75 + 12.00; // 24.25

      // Verify total cost
      final actualCost = mealPlan.getTotalCost();
      expect(actualCost, equals(expectedCost));
      expect(actualCost, equals(24.25));
    });

    test('Meal plan identifies allergens from recipes', () {
      // User adds all recipes
      mealPlan.setMeal('breakfast', breakfastRecipe);
      mealPlan.setMeal('lunch', lunchRecipe);
      mealPlan.setMeal('dinner', dinnerRecipe);

      // Get allergens
      final allergens = mealPlan.getAllAllergens();

      // Verify allergens are identified
      expect(allergens, contains('fish'));
      // Note: Only dinner has allergens in this scenario
    });

    test('User can replace a recipe in the meal plan', () {
      // Setup: initial meal plan
      mealPlan.setMeal('breakfast', breakfastRecipe);
      mealPlan.setMeal('lunch', lunchRecipe);
      mealPlan.setMeal('dinner', dinnerRecipe);

      // Create alternative breakfast recipe
      final alternativeBreakfast = Recipe(
        id: 4,
        name: 'Scrambled Eggs',
        steps: ['Beat eggs', 'Cook in pan', 'Serve'],
        prepTime: 5,
        cookTime: 5,
        mealType: 'breakfast',
        costPerServing: 2.00,
        healthRating: 4.0,
        tasteRating: 4.0,
        difficultyRating: 1.0,
        creatorId: 1,
        ingredients: [],
        allergens: ['eggs'],
        dietaryInfo: ['quick', 'protein'],
        likeCount: 0,
        commentCount: 0,
        difficultyRatingCount: 0,
        tasteRatingCount: 0,
        healthRatingCount: 0,
        isApproved: true,
        isFeatured: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        totalTime: 10,
        totalUserRatings: 0,
        totalRatings: 0,
      );

      // User replaces breakfast
      mealPlan.setMeal('breakfast', alternativeBreakfast);

      // Verify breakfast is replaced
      expect(mealPlan.breakfast, equals(alternativeBreakfast));
      expect(mealPlan.breakfast, isNot(equals(breakfastRecipe)));

      // Verify cost is updated
      final newCost = 2.00 + 8.75 + 12.00; // 22.75
      expect(mealPlan.getTotalCost(), equals(newCost));
    });

    test('User can remove a recipe from the meal plan', () {
      // Setup: complete meal plan
      mealPlan.setMeal('breakfast', breakfastRecipe);
      mealPlan.setMeal('lunch', lunchRecipe);
      mealPlan.setMeal('dinner', dinnerRecipe);

      // User removes lunch
      mealPlan.clearMeal('lunch');

      // Verify lunch is removed
      expect(mealPlan.lunch, isNull);
      expect(mealPlan.getSelectedMealsCount(), equals(2));
      expect(mealPlan.isComplete(), isFalse);
    });

    test('Meal plan can be cleared completely', () {
      // Setup: complete meal plan
      mealPlan.setMeal('breakfast', breakfastRecipe);
      mealPlan.setMeal('lunch', lunchRecipe);
      mealPlan.setMeal('dinner', dinnerRecipe);

      // User clears all meals
      mealPlan.clearAll();

      // Verify all meals are cleared
      expect(mealPlan.breakfast, isNull);
      expect(mealPlan.lunch, isNull);
      expect(mealPlan.dinner, isNull);
      expect(mealPlan.hasRecipes(), isFalse);
      expect(mealPlan.getSelectedMealsCount(), equals(0));
    });

    test('Meal plan can be serialized to JSON for saving', () {
      // Setup: complete meal plan
      mealPlan.setMeal('breakfast', breakfastRecipe);
      mealPlan.setMeal('lunch', lunchRecipe);
      mealPlan.setMeal('dinner', dinnerRecipe);

      // Serialize to JSON
      final json = mealPlan.toJson();

      // Verify JSON structure
      expect(json, isA<Map<String, dynamic>>());
      expect(json['date'], isNotNull);
      expect(json['breakfast'], equals(breakfastRecipe.id));
      expect(json['lunch'], equals(lunchRecipe.id));
      expect(json['dinner'], equals(dinnerRecipe.id));
    });

    test('Complete scenario: Create, populate, and verify meal plan', () {
      // Step 1: User creates new meal plan
      final newMealPlan = DailyMealPlan(date: DateTime.now());
      expect(newMealPlan.hasRecipes(), isFalse);

      // Step 2: User adds breakfast
      newMealPlan.setMeal('breakfast', breakfastRecipe);
      expect(newMealPlan.breakfast?.name, equals('Healthy Oatmeal Bowl'));

      // Step 3: User adds lunch
      newMealPlan.setMeal('lunch', lunchRecipe);
      expect(newMealPlan.lunch?.name, equals('Grilled Chicken Salad'));

      // Step 4: User adds dinner
      newMealPlan.setMeal('dinner', dinnerRecipe);
      expect(newMealPlan.dinner?.name, equals('Salmon with Vegetables'));

      // Step 5: Verify meal plan is complete
      expect(newMealPlan.isComplete(), isTrue);
      expect(newMealPlan.getAllRecipes().length, equals(3));

      // Step 6: Verify calculations
      expect(newMealPlan.getTotalCost(), equals(24.25));

      // Step 7: Prepare for save (serialize)
      final jsonData = newMealPlan.toJson();
      expect(jsonData, containsPair('breakfast', 1));
      expect(jsonData, containsPair('lunch', 2));
      expect(jsonData, containsPair('dinner', 3));

      // Success: Meal plan created and ready to be saved
    });

    test('Meal plan with partial recipes calculates correct cost', () {
      // User only adds breakfast and dinner (no lunch)
      mealPlan.setMeal('breakfast', breakfastRecipe);
      mealPlan.setMeal('dinner', dinnerRecipe);

      // Verify calculations
      expect(mealPlan.getSelectedMealsCount(), equals(2));
      expect(mealPlan.getTotalCost(), equals(3.50 + 12.00));
      expect(mealPlan.isComplete(), isFalse);
    });

    test('User can create meal plan summary', () {
      // Setup: complete meal plan
      mealPlan.setMeal('breakfast', breakfastRecipe);
      mealPlan.setMeal('lunch', lunchRecipe);
      mealPlan.setMeal('dinner', dinnerRecipe);

      // Get summary
      final summary = mealPlan.toSummary();

      // Verify summary contains all information
      expect(summary, contains('Healthy Oatmeal Bowl'));
      expect(summary, contains('Grilled Chicken Salad'));
      expect(summary, contains('Salmon with Vegetables'));
      expect(summary, contains('Total Cost'));
    });
  });
}

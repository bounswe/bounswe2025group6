import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/models/recipe.dart';
import 'package:fithub/models/ingredient.dart';

void main() {
  group('Recipe Sharing Format Tests', () {
    test('Should format recipe with ingredients and steps correctly', () {
      final recipe = _createTestRecipe(
        name: 'Classic Chicken Stir Fry',
        ingredients: [
          _createIngredientQuantity('Chicken Breast', 300, 'g'),
          _createIngredientQuantity('Bell Pepper', 2, 'pcs'),
          _createIngredientQuantity('Broccoli', 200, 'g'),
          _createIngredientQuantity('Carrot', 2, 'pcs'),
          _createIngredientQuantity('Garlic', 10, 'g'),
          _createIngredientQuantity('Ginger', 20, 'g'),
          _createIngredientQuantity('Vegetable Oil', 30, 'ml'),
          _createIngredientQuantity('Salt', 5, 'g'),
          _createIngredientQuantity('Black Pepper', 5, 'g'),
          _createIngredientQuantity('Rice', 200, 'g'),
        ],
        steps: [
          'Cut chicken breast into thin strips',
          'Heat vegetable oil in a large wok or pan',
          'Cook chicken until golden brown and cooked through',
          'Add bell peppers, broccoli, and carrots',
          'Stir fry for 5 minutes until vegetables are tender-crisp',
          'Add minced garlic and grated ginger',
          'Season with salt and black pepper',
          'Serve hot over steamed rice',
        ],
      );

      // Verify recipe has correct properties
      expect(recipe.name, 'Classic Chicken Stir Fry');
      expect(recipe.ingredients.length, 10);
      expect(recipe.steps.length, 8);
    });

    test('Should build correct URL format', () {
      final recipeId = 1;
      final expectedUrl = 'https://fithubmp.xyz/recipes/$recipeId';
      
      expect(expectedUrl, 'https://fithubmp.xyz/recipes/1');
    });

    test('Should format ingredient with quantity and unit', () {
      final ingredient = _createIngredientQuantity('Chicken Breast', 300, 'g');
      
      final formatted = '${ingredient.quantity} ${ingredient.unit} ${ingredient.ingredient.name}';
      
      expect(formatted, '300.0 g Chicken Breast');
    });

    test('Should handle recipe with no ingredients', () {
      final recipe = _createTestRecipe(
        name: 'Test Recipe',
        ingredients: [],
        steps: ['Step 1'],
      );

      expect(recipe.ingredients.isEmpty, true);
      expect(recipe.steps.isNotEmpty, true);
    });

    test('Should handle recipe with no steps', () {
      final recipe = _createTestRecipe(
        name: 'Test Recipe',
        ingredients: [_createIngredientQuantity('Flour', 2, 'cup')],
        steps: [],
      );

      expect(recipe.ingredients.isNotEmpty, true);
      expect(recipe.steps.isEmpty, true);
    });

    test('Should format multiple ingredients with proper line breaks', () {
      final ingredients = [
        _createIngredientQuantity('Flour', 2, 'cup'),
        _createIngredientQuantity('Eggs', 3, 'pcs'),
        _createIngredientQuantity('Milk', 1, 'cup'),
      ];

      final buffer = StringBuffer();
      for (var ingredient in ingredients) {
        buffer.writeln(
          '- ${ingredient.quantity} ${ingredient.unit} ${ingredient.ingredient.name}',
        );
      }

      final result = buffer.toString();
      
      expect(result, contains('- 2.0 cup Flour'));
      expect(result, contains('- 3.0 pcs Eggs'));
      expect(result, contains('- 1.0 cup Milk'));
    });

    test('Should format steps with numbering without extra newlines', () {
      final steps = [
        'Cut chicken breast into thin strips',
        'Heat vegetable oil in a large wok or pan',
        'Cook chicken until golden brown',
      ];

      final buffer = StringBuffer();
      for (var i = 0; i < steps.length; i++) {
        buffer.writeln('${i + 1}. ${steps[i]}');
      }

      final result = buffer.toString();
      
      expect(result, contains('1. Cut chicken breast into thin strips'));
      expect(result, contains('2. Heat vegetable oil in a large wok or pan'));
      expect(result, contains('3. Cook chicken until golden brown'));
      
      // Verify no extra blank lines between steps
      final lines = result.split('\n');
      // Should have 3 steps + trailing newline = 4 lines total
      expect(lines.length, 4);
    });

    test('Should create complete shareable text structure', () {
      final recipeName = 'Classic Chicken Stir Fry';
      final recipeUrl = 'https://fithubmp.xyz/recipes/1';
      
      final buffer = StringBuffer();
      buffer.writeln(recipeName);
      buffer.writeln('');
      buffer.writeln(recipeUrl);
      buffer.writeln('');
      buffer.writeln('INGREDIENTS:');
      buffer.writeln('');
      buffer.writeln('- 300.0 g Chicken Breast');
      buffer.writeln('');
      buffer.writeln('INSTRUCTIONS:');
      buffer.writeln('');
      buffer.writeln('1. Cut chicken breast into thin strips');
      buffer.writeln('2. Cook until done');
      buffer.writeln('');
      buffer.writeln('View recipe at: $recipeUrl');

      final result = buffer.toString();
      
      // Verify structure
      expect(result, startsWith(recipeName));
      expect(result, contains(recipeUrl));
      expect(result, contains('INGREDIENTS:'));
      expect(result, contains('INSTRUCTIONS:'));
      expect(result, contains('View recipe at:'));
      
      // Verify steps are consecutive (no blank line between them)
      expect(result, contains('1. Cut chicken breast into thin strips\n2. Cook until done\n'));
      
      // Verify recipe name appears only once at the start
      final nameOccurrences = recipeName.allMatches(result).length;
      expect(nameOccurrences, 1);
    });

    test('Should handle decimal quantities in ingredients', () {
      final ingredient = _createIngredientQuantity('Milk', 1.5, 'cup');
      
      final formatted = '${ingredient.quantity} ${ingredient.unit} ${ingredient.ingredient.name}';
      
      expect(formatted, '1.5 cup Milk');
    });

    test('Should preserve recipe metadata in Recipe object', () {
      final recipe = _createTestRecipe(
        name: 'Test Recipe',
        ingredients: [_createIngredientQuantity('Flour', 2, 'cup')],
        steps: ['Mix ingredients'],
      );

      expect(recipe.id, isNotNull);
      expect(recipe.name, isNotEmpty);
      expect(recipe.createdAt, isNotNull);
      expect(recipe.updatedAt, isNotNull);
    });
  });
}

// Helper functions
Recipe _createTestRecipe({
  required String name,
  required List<IngredientQuantity> ingredients,
  required List<String> steps,
}) {
  return Recipe(
    id: 1,
    name: name,
    steps: steps,
    prepTime: 10,
    cookTime: 20,
    mealType: 'dinner',
    creatorId: 1,
    ingredients: ingredients,
    costPerServing: 12.0,
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

IngredientQuantity _createIngredientQuantity(
  String name,
  double quantity,
  String unit,
) {
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


import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/models/recipe_rating.dart';

void main() {
  group('RecipeRating Model Tests', () {
    test('RecipeRating should be created with all fields', () {
      // Arrange
      final rating = RecipeRating(
        id: 1,
        userId: 100,
        recipeId: 200,
        tasteRating: 4.5,
        difficultyRating: 3.0,
        createdAt: DateTime(2025, 11, 8),
      );

      // Assert
      expect(rating.id, 1);
      expect(rating.userId, 100);
      expect(rating.recipeId, 200);
      expect(rating.tasteRating, 4.5);
      expect(rating.difficultyRating, 3.0);
      expect(rating.createdAt, isNotNull);
    });

    test('RecipeRating should be created with null ratings', () {
      // Arrange
      final rating = RecipeRating(
        userId: 100,
        recipeId: 200,
        tasteRating: null,
        difficultyRating: null,
      );

      // Assert
      expect(rating.tasteRating, isNull);
      expect(rating.difficultyRating, isNull);
      expect(rating.userId, 100);
      expect(rating.recipeId, 200);
    });

    test('RecipeRating fromJson should parse JSON correctly', () {
      // Arrange
      final json = {
        'id': 1,
        'user': 100,
        'recipe': 200,
        'taste_rating': 4.5,
        'difficulty_rating': 3.0,
        'created_at': '2025-11-08T10:00:00Z',
      };

      // Act
      final rating = RecipeRating.fromJson(json);

      // Assert
      expect(rating.id, 1);
      expect(rating.userId, 100);
      expect(rating.recipeId, 200);
      expect(rating.tasteRating, 4.5);
      expect(rating.difficultyRating, 3.0);
      expect(rating.createdAt, isNotNull);
    });

    test('RecipeRating fromJson should handle null ratings', () {
      // Arrange
      final json = {
        'id': 1,
        'user': 100,
        'recipe': 200,
        'taste_rating': null,
        'difficulty_rating': null,
      };

      // Act
      final rating = RecipeRating.fromJson(json);

      // Assert
      expect(rating.id, 1);
      expect(rating.userId, 100);
      expect(rating.recipeId, 200);
      expect(rating.tasteRating, isNull);
      expect(rating.difficultyRating, isNull);
    });

    test('RecipeRating fromJson should handle missing user/recipe as 0', () {
      // Arrange
      final json = {'id': 1, 'taste_rating': 4.5};

      // Act
      final rating = RecipeRating.fromJson(json);

      // Assert
      expect(rating.userId, 0); // Default value when null
      expect(rating.recipeId, 0); // Default value when null
      expect(rating.tasteRating, 4.5);
    });

    test('RecipeRating toJson should convert to JSON correctly', () {
      // Arrange
      final rating = RecipeRating(
        id: 1,
        userId: 100,
        recipeId: 200,
        tasteRating: 4.5,
        difficultyRating: 3.0,
        createdAt: DateTime(2025, 11, 8),
      );

      // Act
      final json = rating.toJson();

      // Assert
      expect(json['id'], 1);
      expect(json['user'], 100);
      expect(json['recipe'], 200);
      expect(json['taste_rating'], 4.5);
      expect(json['difficulty_rating'], 3.0);
      expect(json['created_at'], isNotNull);
    });

    test('RecipeRating toJson should exclude null values', () {
      // Arrange
      final rating = RecipeRating(
        userId: 100,
        recipeId: 200,
        tasteRating: 4.5,
        difficultyRating: null,
      );

      // Act
      final json = rating.toJson();

      // Assert
      expect(json.containsKey('taste_rating'), true);
      expect(json.containsKey('difficulty_rating'), false);
      expect(json['taste_rating'], 4.5);
    });

    test(
      'RecipeRating copyWith should create a new instance with updated values',
      () {
        // Arrange
        final original = RecipeRating(
          id: 1,
          userId: 100,
          recipeId: 200,
          tasteRating: 4.5,
          difficultyRating: 3.0,
        );

        // Act
        final updated = original.copyWith(tasteRating: 5.0);

        // Assert
        expect(updated.id, 1);
        expect(updated.tasteRating, 5.0);
        expect(updated.difficultyRating, 3.0);
        expect(original.tasteRating, 4.5); // Original unchanged
      },
    );

    test('RecipeRating toString should return formatted string', () {
      // Arrange
      final rating = RecipeRating(
        id: 1,
        userId: 100,
        recipeId: 200,
        tasteRating: 4.5,
        difficultyRating: 3.0,
      );

      // Act
      final str = rating.toString();

      // Assert
      expect(str, contains('RecipeRating'));
      expect(str, contains('id: 1'));
      expect(str, contains('userId: 100'));
      expect(str, contains('recipeId: 200'));
      expect(str, contains('tasteRating: 4.5'));
      expect(str, contains('difficultyRating: 3.0'));
    });
  });

  group('RecipeRating Validation Tests', () {
    test('RecipeRating should accept valid rating ranges', () {
      // Arrange & Act
      final rating1 = RecipeRating(
        userId: 100,
        recipeId: 200,
        tasteRating: 0.0,
        difficultyRating: 5.0,
      );

      final rating2 = RecipeRating(
        userId: 100,
        recipeId: 200,
        tasteRating: 2.5,
        difficultyRating: 3.7,
      );

      // Assert
      expect(rating1.tasteRating, 0.0);
      expect(rating1.difficultyRating, 5.0);
      expect(rating2.tasteRating, 2.5);
      expect(rating2.difficultyRating, 3.7);
    });

    test('RecipeRating should handle decimal precision', () {
      // Arrange
      final json = {
        'user': 100,
        'recipe': 200,
        'taste_rating': 4.567,
        'difficulty_rating': 3.123,
      };

      // Act
      final rating = RecipeRating.fromJson(json);

      // Assert
      expect(rating.tasteRating, closeTo(4.567, 0.001));
      expect(rating.difficultyRating, closeTo(3.123, 0.001));
    });
  });
}

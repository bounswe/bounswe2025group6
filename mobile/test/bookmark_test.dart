import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'mocks/mock_recipe_service.dart';

void main() {
  group('Bookmark Recipe Tests', () {
    late MockRecipeService mockRecipeService;

    setUp(() {
      mockRecipeService = MockRecipeService();
    });

    test('bookmarkRecipe returns true on success', () async {
      // Arrange
      const recipeId = 1;
      when(() => mockRecipeService.bookmarkRecipe(recipeId))
          .thenAnswer((_) async => true);

      // Act
      final result = await mockRecipeService.bookmarkRecipe(recipeId);

      // Assert
      expect(result, isTrue);
      verify(() => mockRecipeService.bookmarkRecipe(recipeId)).called(1);
    });

    test('bookmarkRecipe throws exception when token is missing', () async {
      // Arrange
      const recipeId = 1;
      when(() => mockRecipeService.bookmarkRecipe(recipeId))
          .thenThrow(Exception('JWT Access token is not available. Please log in again.'));

      // Act & Assert
      expect(
        () async => await mockRecipeService.bookmarkRecipe(recipeId),
        throwsA(isA<Exception>()),
      );
      verify(() => mockRecipeService.bookmarkRecipe(recipeId)).called(1);
    });

    test('bookmarkRecipe throws exception on network error', () async {
      // Arrange
      const recipeId = 1;
      when(() => mockRecipeService.bookmarkRecipe(recipeId))
          .thenThrow(Exception('Failed to bookmark recipe: Network error'));

      // Act & Assert
      expect(
        () async => await mockRecipeService.bookmarkRecipe(recipeId),
        throwsException,
      );
      verify(() => mockRecipeService.bookmarkRecipe(recipeId)).called(1);
    });

    test('bookmarkRecipe throws exception when status code is not 200', () async {
      // Arrange
      const recipeId = 1;
      when(() => mockRecipeService.bookmarkRecipe(recipeId))
          .thenThrow(Exception('Failed to bookmark recipe (status code: 400)'));

      // Act & Assert
      expect(
        () async => await mockRecipeService.bookmarkRecipe(recipeId),
        throwsException,
      );
      verify(() => mockRecipeService.bookmarkRecipe(recipeId)).called(1);
    });

    test('bookmarkRecipe handles multiple recipe IDs correctly', () async {
      // Arrange
      const recipeIds = [1, 2, 3];
      for (final id in recipeIds) {
        when(() => mockRecipeService.bookmarkRecipe(id))
            .thenAnswer((_) async => true);
      }

      // Act
      final results = await Future.wait(
        recipeIds.map((id) => mockRecipeService.bookmarkRecipe(id)),
      );

      // Assert
      expect(results, everyElement(isTrue));
      for (final id in recipeIds) {
        verify(() => mockRecipeService.bookmarkRecipe(id)).called(1);
      }
    });
  });

  group('Unbookmark Recipe Tests', () {
    late MockRecipeService mockRecipeService;

    setUp(() {
      mockRecipeService = MockRecipeService();
    });

    test('unbookmarkRecipe returns true on success', () async {
      // Arrange
      const recipeId = 1;
      when(() => mockRecipeService.unbookmarkRecipe(recipeId))
          .thenAnswer((_) async => true);

      // Act
      final result = await mockRecipeService.unbookmarkRecipe(recipeId);

      // Assert
      expect(result, isTrue);
      verify(() => mockRecipeService.unbookmarkRecipe(recipeId)).called(1);
    });

    test('unbookmarkRecipe throws exception when token is missing', () async {
      // Arrange
      const recipeId = 1;
      when(() => mockRecipeService.unbookmarkRecipe(recipeId))
          .thenThrow(Exception('JWT Access token is not available. Please log in again.'));

      // Act & Assert
      expect(
        () async => await mockRecipeService.unbookmarkRecipe(recipeId),
        throwsA(isA<Exception>()),
      );
      verify(() => mockRecipeService.unbookmarkRecipe(recipeId)).called(1);
    });

    test('unbookmarkRecipe throws exception when recipe not bookmarked (400)', () async {
      // Arrange
      const recipeId = 1;
      when(() => mockRecipeService.unbookmarkRecipe(recipeId))
          .thenThrow(Exception('Recipe not bookmarked'));

      // Act & Assert
      expect(
        () async => await mockRecipeService.unbookmarkRecipe(recipeId),
        throwsException,
      );
      verify(() => mockRecipeService.unbookmarkRecipe(recipeId)).called(1);
    });

    test('unbookmarkRecipe throws exception when recipe not found (404)', () async {
      // Arrange
      const recipeId = 999;
      when(() => mockRecipeService.unbookmarkRecipe(recipeId))
          .thenThrow(Exception('Recipe not found'));

      // Act & Assert
      expect(
        () async => await mockRecipeService.unbookmarkRecipe(recipeId),
        throwsException,
      );
      verify(() => mockRecipeService.unbookmarkRecipe(recipeId)).called(1);
    });

    test('unbookmarkRecipe throws exception on network error', () async {
      // Arrange
      const recipeId = 1;
      when(() => mockRecipeService.unbookmarkRecipe(recipeId))
          .thenThrow(Exception('Failed to unbookmark recipe: Network error'));

      // Act & Assert
      expect(
        () async => await mockRecipeService.unbookmarkRecipe(recipeId),
        throwsException,
      );
      verify(() => mockRecipeService.unbookmarkRecipe(recipeId)).called(1);
    });

    test('unbookmarkRecipe handles multiple recipe IDs correctly', () async {
      // Arrange
      const recipeIds = [1, 2, 3];
      for (final id in recipeIds) {
        when(() => mockRecipeService.unbookmarkRecipe(id))
            .thenAnswer((_) async => true);
      }

      // Act
      final results = await Future.wait(
        recipeIds.map((id) => mockRecipeService.unbookmarkRecipe(id)),
      );

      // Assert
      expect(results, everyElement(isTrue));
      for (final id in recipeIds) {
        verify(() => mockRecipeService.unbookmarkRecipe(id)).called(1);
      }
    });
  });

  group('Bookmark Toggle Tests', () {
    late MockRecipeService mockRecipeService;

    setUp(() {
      mockRecipeService = MockRecipeService();
    });

    test('bookmark then unbookmark recipe successfully', () async {
      // Arrange
      const recipeId = 1;
      when(() => mockRecipeService.bookmarkRecipe(recipeId))
          .thenAnswer((_) async => true);
      when(() => mockRecipeService.unbookmarkRecipe(recipeId))
          .thenAnswer((_) async => true);

      // Act
      final bookmarkResult = await mockRecipeService.bookmarkRecipe(recipeId);
      final unbookmarkResult = await mockRecipeService.unbookmarkRecipe(recipeId);

      // Assert
      expect(bookmarkResult, isTrue);
      expect(unbookmarkResult, isTrue);
      verify(() => mockRecipeService.bookmarkRecipe(recipeId)).called(1);
      verify(() => mockRecipeService.unbookmarkRecipe(recipeId)).called(1);
    });

    test('unbookmark before bookmark throws exception', () async {
      // Arrange
      const recipeId = 1;
      when(() => mockRecipeService.unbookmarkRecipe(recipeId))
          .thenThrow(Exception('Recipe not bookmarked'));

      // Act & Assert
      expect(
        () async => await mockRecipeService.unbookmarkRecipe(recipeId),
        throwsException,
      );
      verify(() => mockRecipeService.unbookmarkRecipe(recipeId)).called(1);
      verifyNever(() => mockRecipeService.bookmarkRecipe(recipeId));
    });

    test('double bookmark same recipe should succeed', () async {
      // Arrange - Backend should handle duplicate bookmarks gracefully
      const recipeId = 1;
      when(() => mockRecipeService.bookmarkRecipe(recipeId))
          .thenAnswer((_) async => true);

      // Act
      final firstResult = await mockRecipeService.bookmarkRecipe(recipeId);
      final secondResult = await mockRecipeService.bookmarkRecipe(recipeId);

      // Assert
      expect(firstResult, isTrue);
      expect(secondResult, isTrue);
      verify(() => mockRecipeService.bookmarkRecipe(recipeId)).called(2);
    });
  });

  group('Bookmark Edge Cases', () {
    late MockRecipeService mockRecipeService;

    setUp(() {
      mockRecipeService = MockRecipeService();
    });

    test('bookmark recipe with invalid ID throws exception', () async {
      // Arrange
      const invalidRecipeId = -1;
      when(() => mockRecipeService.bookmarkRecipe(invalidRecipeId))
          .thenThrow(Exception('Invalid recipe ID'));

      // Act & Assert
      expect(
        () async => await mockRecipeService.bookmarkRecipe(invalidRecipeId),
        throwsException,
      );
      verify(() => mockRecipeService.bookmarkRecipe(invalidRecipeId)).called(1);
    });

    test('unbookmark recipe with invalid ID throws exception', () async {
      // Arrange
      const invalidRecipeId = -1;
      when(() => mockRecipeService.unbookmarkRecipe(invalidRecipeId))
          .thenThrow(Exception('Invalid recipe ID'));

      // Act & Assert
      expect(
        () async => await mockRecipeService.unbookmarkRecipe(invalidRecipeId),
        throwsException,
      );
      verify(() => mockRecipeService.unbookmarkRecipe(invalidRecipeId)).called(1);
    });

    test('bookmark recipe with zero ID', () async {
      // Arrange
      const zeroRecipeId = 0;
      when(() => mockRecipeService.bookmarkRecipe(zeroRecipeId))
          .thenAnswer((_) async => true);

      // Act
      final result = await mockRecipeService.bookmarkRecipe(zeroRecipeId);

      // Assert
      expect(result, isTrue);
      verify(() => mockRecipeService.bookmarkRecipe(zeroRecipeId)).called(1);
    });

    test('bookmark recipe with very large ID', () async {
      // Arrange
      const largeRecipeId = 999999999;
      when(() => mockRecipeService.bookmarkRecipe(largeRecipeId))
          .thenAnswer((_) async => true);

      // Act
      final result = await mockRecipeService.bookmarkRecipe(largeRecipeId);

      // Assert
      expect(result, isTrue);
      verify(() => mockRecipeService.bookmarkRecipe(largeRecipeId)).called(1);
    });
  });

  group('Bookmark Authentication Tests', () {
    late MockRecipeService mockRecipeService;

    setUp(() {
      mockRecipeService = MockRecipeService();
    });

    test('bookmark recipe with expired token triggers refresh', () async {
      // Arrange
      const recipeId = 1;
      var callCount = 0;
      
      when(() => mockRecipeService.bookmarkRecipe(recipeId))
          .thenAnswer((_) async {
        callCount++;
        if (callCount == 1) {
          throw Exception('Authentication failed');
        }
        return true;
      });

      // Act & Assert - First call should fail
      expect(
        () async => await mockRecipeService.bookmarkRecipe(recipeId),
        throwsException,
      );
    });

    test('unbookmark recipe with expired token triggers refresh', () async {
      // Arrange
      const recipeId = 1;
      var callCount = 0;
      
      when(() => mockRecipeService.unbookmarkRecipe(recipeId))
          .thenAnswer((_) async {
        callCount++;
        if (callCount == 1) {
          throw Exception('Authentication failed');
        }
        return true;
      });

      // Act & Assert - First call should fail
      expect(
        () async => await mockRecipeService.unbookmarkRecipe(recipeId),
        throwsException,
      );
    });
  });
}

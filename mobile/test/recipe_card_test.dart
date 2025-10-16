import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/widgets/recipe_card.dart';
import 'package:fithub/models/recipe.dart';

void main() {
  group('RecipeCard Widget Tests', () {
    // Helper function to create a test recipe
    Recipe createTestRecipe({
      int id = 1,
      String name = 'Test Recipe',
      String? imageUrl,
    }) {
      return Recipe(
        id: id,
        name: name,
        steps: ['Step 1', 'Step 2'],
        prepTime: 10,
        cookTime: 20,
        mealType: 'breakfast',
        creatorId: 1,
        ingredients: [],
        likeCount: 5,
        commentCount: 3,
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
        imageFullUrl: imageUrl,
        imageRelativeUrl: null,
      );
    }

    testWidgets('displays recipe name correctly', (WidgetTester tester) async {
      final recipe = createTestRecipe(name: 'Delicious Pancakes');

      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: RecipeCard(recipe: recipe))),
      );

      expect(find.text('Delicious Pancakes'), findsOneWidget);
    });

    testWidgets('displays meal type and time correctly', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe();

      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: RecipeCard(recipe: recipe))),
      );

      expect(find.text('breakfast'), findsOneWidget);
      expect(find.text('30 mins'), findsOneWidget);
    });

    testWidgets('displays placeholder icon when no image URL', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe(imageUrl: null);

      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: RecipeCard(recipe: recipe))),
      );

      // Should show placeholder restaurant icon
      expect(find.byIcon(Icons.restaurant), findsOneWidget);
    });

    testWidgets('displays placeholder icon when empty image URL', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe(imageUrl: '');

      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: RecipeCard(recipe: recipe))),
      );

      // Should show placeholder restaurant icon
      expect(find.byIcon(Icons.restaurant), findsOneWidget);
    });

    testWidgets('displays cost per serving when available', (
      WidgetTester tester,
    ) async {
      final recipe = Recipe(
        id: 1,
        name: 'Expensive Recipe',
        steps: ['Step 1'],
        prepTime: 10,
        cookTime: 20,
        mealType: 'dinner',
        creatorId: 1,
        ingredients: [],
        costPerServing: 15.50,
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
        imageFullUrl: null,
      );

      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: RecipeCard(recipe: recipe))),
      );

      expect(find.textContaining('15.50'), findsOneWidget);
      expect(find.textContaining('per serving'), findsOneWidget);
    });

    testWidgets('card is tappable', (WidgetTester tester) async {
      final recipe = createTestRecipe();

      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: RecipeCard(recipe: recipe))),
      );

      // Find the InkWell widget (makes card tappable)
      expect(find.byType(InkWell), findsOneWidget);

      // Verify the card can be tapped
      await tester.tap(find.byType(InkWell));
      await tester.pump();

      // After tap, should navigate (but we're not testing navigation here)
    });

    testWidgets('displays correct icons for meal type and time', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe();

      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: RecipeCard(recipe: recipe))),
      );

      // Should have icons for meal type and time
      expect(find.byIcon(Icons.restaurant_menu), findsOneWidget);
      expect(find.byIcon(Icons.access_time), findsOneWidget);
    });

    testWidgets('card has proper styling and elevation', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe();

      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: RecipeCard(recipe: recipe))),
      );

      final card = tester.widget<Card>(find.byType(Card));
      expect(card.elevation, 2);
      expect(card.clipBehavior, Clip.antiAlias);
    });

    testWidgets('truncates long recipe names', (WidgetTester tester) async {
      final recipe = createTestRecipe(
        name:
            'This is a very long recipe name that should be truncated to prevent overflow issues in the UI',
      );

      await tester.pumpWidget(
        MaterialApp(home: Scaffold(body: RecipeCard(recipe: recipe))),
      );

      final text = tester.widget<Text>(
        find.text(
          'This is a very long recipe name that should be truncated to prevent overflow issues in the UI',
        ),
      );

      expect(text.maxLines, 2);
      expect(text.overflow, TextOverflow.ellipsis);
    });
  });
}

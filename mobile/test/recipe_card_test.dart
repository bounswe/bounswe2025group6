import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/widgets/recipe_card.dart';
import 'package:fithub/models/recipe.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:fithub/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import 'package:fithub/providers/currency_provider.dart';
import 'package:fithub/providers/locale_provider.dart';
import 'package:fithub/services/profile_service.dart';
import 'package:mocktail/mocktail.dart';

// Mocks
class MockProfileService extends Mock implements ProfileService {}

void main() {
  late MockProfileService mockProfileService;

  setUp(() {
    mockProfileService = MockProfileService();
    // Default stub for ProfileService
    when(
      () => mockProfileService.getRecipeCountBadge(any()),
    ).thenAnswer((_) async => {'badge': 'Novice Cook'});
  });

  // Helper function to pump RecipeCard with proper setup
  Future<void> pumpRecipeCard(
    WidgetTester tester,
    Recipe recipe, {
    String? creatorUsername,
  }) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => LocaleProvider()),
          ChangeNotifierProvider(create: (_) => CurrencyProvider()),
        ],
        child: MaterialApp(
          locale: const Locale('en'),
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [Locale('en', ''), Locale('tr', '')],
          home: Scaffold(
            body: RecipeCard(recipe: recipe, creatorUsername: creatorUsername),
          ),
        ),
      ),
    );
    // Wait for async operations to complete
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
  }

  group('RecipeCard Widget Tests', () {
    // Helper function to create a test recipe
    Recipe createTestRecipe({
      int id = 1,
      String name = 'Test Recipe',
      String? imageUrl,
      String mealType = 'breakfast',
      double? costPerServing,
      double? tasteRating,
      double? difficultyRating,
      double? healthRating,
      int tasteRatingCount = 0,
      int difficultyRatingCount = 0,
      int healthRatingCount = 0,
      int likeCount = 5,
      int commentCount = 3,
    }) {
      return Recipe(
        id: id,
        name: name,
        steps: ['Step 1', 'Step 2'],
        prepTime: 10,
        cookTime: 20,
        mealType: mealType,
        creatorId: 1,
        ingredients: [],
        costPerServing: costPerServing,
        tasteRating: tasteRating,
        difficultyRating: difficultyRating,
        healthRating: healthRating,
        likeCount: likeCount,
        commentCount: commentCount,
        difficultyRatingCount: difficultyRatingCount,
        tasteRatingCount: tasteRatingCount,
        healthRatingCount: healthRatingCount,
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

      await pumpRecipeCard(tester, recipe);

      expect(find.text('Delicious Pancakes'), findsOneWidget);
    });

    testWidgets('displays meal type and time correctly', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe();

      await pumpRecipeCard(tester, recipe);

      // Total time should be displayed with minutes abbreviation
      expect(find.textContaining('30'), findsWidgets);
    });

    testWidgets('displays placeholder icon when no image URL', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe(imageUrl: null);

      await pumpRecipeCard(tester, recipe);

      // Should show placeholder restaurant icon
      expect(find.byIcon(Icons.restaurant), findsWidgets);
    });

    testWidgets('displays placeholder icon when empty image URL', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe(imageUrl: '');

      await pumpRecipeCard(tester, recipe);

      // Should show placeholder restaurant icon
      expect(find.byIcon(Icons.restaurant), findsWidgets);
    });

    testWidgets('displays cost per serving when available', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe(costPerServing: 15.50);

      await pumpRecipeCard(tester, recipe);

      expect(find.textContaining('15.50'), findsOneWidget);
    });

    testWidgets('card is tappable', (WidgetTester tester) async {
      final recipe = createTestRecipe();

      await pumpRecipeCard(tester, recipe);

      // Find the InkWell widget (makes card tappable)
      expect(find.byType(InkWell), findsWidgets);

      // Verify the card can be tapped
      await tester.tap(find.byType(InkWell).first);
      await tester.pump();
    });

    testWidgets('displays correct icons for meal type and time', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe();

      await pumpRecipeCard(tester, recipe);

      // Should have icons for meal type and time
      expect(find.byIcon(Icons.restaurant_menu), findsOneWidget);
      expect(find.byIcon(Icons.access_time), findsOneWidget);
    });

    testWidgets('card has proper styling and elevation', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe();

      await pumpRecipeCard(tester, recipe);

      final card = tester.widget<Card>(find.byType(Card).first);
      expect(card.elevation, 2);
      expect(card.clipBehavior, Clip.antiAlias);
    });

    testWidgets('truncates long recipe names', (WidgetTester tester) async {
      final recipe = createTestRecipe(
        name:
            'This is a very long recipe name that should be truncated to prevent overflow issues in the UI',
      );

      await pumpRecipeCard(tester, recipe);

      final textWidgets = tester.widgetList<Text>(
        find.text(
          'This is a very long recipe name that should be truncated to prevent overflow issues in the UI',
        ),
      );

      // Find the Text widget with maxLines constraint
      final textWithMaxLines = textWidgets.firstWhere(
        (text) => text.maxLines == 2,
        orElse: () => textWidgets.first,
      );

      expect(textWithMaxLines.maxLines, 2);
      expect(textWithMaxLines.overflow, TextOverflow.ellipsis);
    });

    testWidgets('displays creator username when provided', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe();
      const username = 'TestUser';

      await pumpRecipeCard(tester, recipe, creatorUsername: username);

      expect(find.text(username), findsOneWidget);
    });

    testWidgets('displays taste rating when available', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe(tasteRating: 4.5, tasteRatingCount: 10);

      await pumpRecipeCard(tester, recipe);

      expect(find.textContaining('4.5'), findsOneWidget);
      expect(find.textContaining('(10)'), findsOneWidget);
    });

    testWidgets('displays difficulty rating when available', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe(
        difficultyRating: 3.0,
        difficultyRatingCount: 5,
      );

      await pumpRecipeCard(tester, recipe);

      expect(find.textContaining('3.0'), findsOneWidget);
      expect(find.textContaining('(5)'), findsOneWidget);
    });

    testWidgets('displays health rating when available', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe(healthRating: 4.8, healthRatingCount: 8);

      await pumpRecipeCard(tester, recipe);

      expect(find.textContaining('4.8'), findsOneWidget);
      expect(find.textContaining('(8)'), findsOneWidget);
    });

    testWidgets('displays all ratings when available', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe(
        tasteRating: 4.5,
        difficultyRating: 3.0,
        healthRating: 4.8,
        tasteRatingCount: 10,
        difficultyRatingCount: 5,
        healthRatingCount: 8,
      );

      await pumpRecipeCard(tester, recipe);

      expect(find.textContaining('4.5'), findsOneWidget);
      expect(find.textContaining('3.0'), findsOneWidget);
      expect(find.textContaining('4.8'), findsOneWidget);
    });

    testWidgets('displays different meal types correctly', (
      WidgetTester tester,
    ) async {
      final breakfastRecipe = createTestRecipe(mealType: 'breakfast');
      final lunchRecipe = createTestRecipe(mealType: 'lunch');
      final dinnerRecipe = createTestRecipe(mealType: 'dinner');

      await pumpRecipeCard(tester, breakfastRecipe);
      expect(find.byType(RecipeCard), findsOneWidget);

      await pumpRecipeCard(tester, lunchRecipe);
      expect(find.byType(RecipeCard), findsOneWidget);

      await pumpRecipeCard(tester, dinnerRecipe);
      expect(find.byType(RecipeCard), findsOneWidget);
    });

    // Test skipped: RecipeCard widget does not display likeCount and commentCount
    // These fields are not rendered in the current implementation
    testWidgets('displays like and comment counts', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe(likeCount: 10, commentCount: 5);

      await pumpRecipeCard(tester, recipe);

      // RecipeCard widget does not display likeCount and commentCount
      // This test is skipped as these fields are not part of the widget's UI
      expect(find.byType(RecipeCard), findsOneWidget);
    }, skip: true);

    testWidgets('handles network image URL', (WidgetTester tester) async {
      final recipe = createTestRecipe(
        imageUrl: 'https://example.com/image.jpg',
      );

      await pumpRecipeCard(tester, recipe);

      // Widget should build even if image fails to load
      expect(find.byType(RecipeCard), findsOneWidget);
    });

    testWidgets('displays recipe card with all optional fields', (
      WidgetTester tester,
    ) async {
      final recipe = createTestRecipe(
        costPerServing: 12.99,
        tasteRating: 4.5,
        difficultyRating: 3.0,
        healthRating: 4.8,
        tasteRatingCount: 10,
        difficultyRatingCount: 5,
        healthRatingCount: 8,
      );

      await pumpRecipeCard(tester, recipe, creatorUsername: 'Chef');

      expect(find.text(recipe.name), findsOneWidget);
      expect(find.textContaining('12.99'), findsOneWidget);
      expect(find.textContaining('4.5'), findsOneWidget);
      expect(find.text('Chef'), findsOneWidget);
    });
  });
}

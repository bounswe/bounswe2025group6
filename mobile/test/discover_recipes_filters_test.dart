import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:fithub/l10n/app_localizations.dart';
import 'package:fithub/models/paginated_recipes.dart';
import 'package:fithub/models/recipe.dart';
import 'package:fithub/providers/currency_provider.dart';
import 'package:fithub/screens/discover_recipes_screen.dart';
import 'package:fithub/services/recipe_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> _pumpDiscoverScreen(
    WidgetTester tester, {
    RecipeService? recipeService,
  }) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => CurrencyProvider(),
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: DiscoverRecipesScreen(
            recipeService: recipeService ?? _FakeRecipeService(),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();
  }

  testWidgets('filter button opens sheet with apply action', (tester) async {
    await _pumpDiscoverScreen(tester);
    final loc = AppLocalizations.of(
      tester.element(find.byType(DiscoverRecipesScreen)),
    )!;

    expect(find.byKey(const Key('discoverFiltersButton')), findsOneWidget);
    expect(find.text(loc.searchRecipes), findsOneWidget);

    await tester.tap(find.byKey(const Key('discoverFiltersButton')));
    await tester.pumpAndSettle();

    expect(find.byType(DraggableScrollableSheet), findsOneWidget);
    expect(find.text(loc.applyFilters), findsOneWidget);
  });

  testWidgets('shows empty state text when no recipes available', (tester) async {
    await _pumpDiscoverScreen(tester);
    final loc = AppLocalizations.of(
      tester.element(find.byType(DiscoverRecipesScreen)),
    )!;

    expect(find.text(loc.noRecipesFound), findsOneWidget);
  });

  testWidgets('discover header shows search prompt and filter button', (tester) async {
    await _pumpDiscoverScreen(tester);
    final loc = AppLocalizations.of(
      tester.element(find.byType(DiscoverRecipesScreen)),
    )!;

    expect(find.text(loc.searchRecipes), findsOneWidget);
    expect(find.byKey(const Key('discoverFiltersButton')), findsOneWidget);
  });

  testWidgets('filter sheet shows preferences section', (tester) async {
    // Set a large screen size to ensure all content is visible without scrolling
    tester.view.physicalSize = const Size(1080, 3000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await _pumpDiscoverScreen(tester);
    final loc = AppLocalizations.of(
      tester.element(find.byType(DiscoverRecipesScreen)),
    )!;

    await tester.tap(find.byKey(const Key('discoverFiltersButton')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('discoverPreferencesCard')), findsOneWidget);
    expect(find.byKey(const Key('discoverHasImageSwitch')), findsOneWidget);
  });

  testWidgets('tapping apply filters closes sheet', (tester) async {
    await _pumpDiscoverScreen(tester);
    final loc = AppLocalizations.of(
      tester.element(find.byType(DiscoverRecipesScreen)),
    )!;

    await tester.tap(find.byKey(const Key('discoverFiltersButton')));
    await tester.pumpAndSettle();
    expect(find.byType(DraggableScrollableSheet), findsOneWidget);

    await tester.tap(find.text(loc.applyFilters));
    await tester.pumpAndSettle();

    expect(find.byType(DraggableScrollableSheet), findsNothing);
  });

  testWidgets('applies entered calories filter to the service', (tester) async {
    final capturingService = _CapturingRecipeService();

    tester.view.physicalSize = const Size(1080, 3000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await _pumpDiscoverScreen(tester, recipeService: capturingService);
    final loc = AppLocalizations.of(
      tester.element(find.byType(DiscoverRecipesScreen)),
    )!;

    await tester.tap(find.byKey(const Key('discoverFiltersButton')));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byKey(const Key('discoverCaloriesField')),
      '450',
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text(loc.applyFilters));
    await tester.pumpAndSettle();

    expect(capturingService.lastMaxCalories, 450);
    expect(capturingService.callCount, greaterThanOrEqualTo(2));
  });
}

class _FakeRecipeService extends RecipeService {
  @override
  Future<PaginatedRecipes> getFilteredRecipes({int page = 1, int pageSize = 10, String? name, String? mealType, double? minCostPerServing, double? maxCostPerServing, int? minPrepTime, int? maxPrepTime, int? minCookTime, int? maxCookTime, int? minTotalTime, int? maxTotalTime, double? minCalories, double? maxCalories, double? minProtein, double? maxProtein, double? minCarbs, double? maxCarbs, double? minFat, double? maxFat, double? minDifficultyRating, double? maxDifficultyRating, double? minTasteRating, double? maxTasteRating, double? minHealthRating, double? maxHealthRating, int? minLikeCount, int? maxLikeCount, String? excludeAllergens, bool? hasImage, bool? isApproved, bool? isFeatured}) async {
    return PaginatedRecipes(page: page, pageSize: pageSize, total: 0, results: <Recipe>[]);
  }
}

class _CapturingRecipeService extends RecipeService {
  double? lastMaxCalories;
  int callCount = 0;

  @override
  Future<PaginatedRecipes> getFilteredRecipes({
    int page = 1,
    int pageSize = 10,
    String? name,
    String? mealType,
    double? minCostPerServing,
    double? maxCostPerServing,
    int? minPrepTime,
    int? maxPrepTime,
    int? minCookTime,
    int? maxCookTime,
    int? minTotalTime,
    int? maxTotalTime,
    double? minCalories,
    double? maxCalories,
    double? minProtein,
    double? maxProtein,
    double? minCarbs,
    double? maxCarbs,
    double? minFat,
    double? maxFat,
    double? minDifficultyRating,
    double? maxDifficultyRating,
    double? minTasteRating,
    double? maxTasteRating,
    double? minHealthRating,
    double? maxHealthRating,
    int? minLikeCount,
    int? maxLikeCount,
    String? excludeAllergens,
    bool? hasImage,
    bool? isApproved,
    bool? isFeatured,
  }) async {
    callCount += 1;
    lastMaxCalories = maxCalories;

    return PaginatedRecipes(
      page: page,
      pageSize: pageSize,
      total: 0,
      results: <Recipe>[],
    );
  }
}

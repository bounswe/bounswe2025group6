import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../models/recipe.dart';
import '../models/daily_meal_plan.dart';
import '../models/shopping_list.dart';
import '../models/user_profile.dart';
import '../services/meal_planner_service.dart';
import '../services/profile_service.dart';
import '../services/recipe_service.dart';
import '../widgets/recipe_card.dart';
import '../widgets/meal_planner_filter_panel.dart';
import '../widgets/recipe_selector_dialog.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';
import '../utils/unit_translator.dart';
import '../providers/currency_provider.dart';
import '../utils/date_formatter.dart';
import '../utils/ingredient_translator.dart';

class MealPlannerScreen extends StatefulWidget {
  const MealPlannerScreen({Key? key}) : super(key: key);

  @override
  State<MealPlannerScreen> createState() => _MealPlannerScreenState();
}

class _MealPlannerScreenState extends State<MealPlannerScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final MealPlannerService _mealPlannerService = MealPlannerService();
  final ProfileService _profileService = ProfileService();

  // State
  DailyMealPlan _mealPlan = DailyMealPlan(date: DateTime.now());
  ShoppingList? _shoppingList;
  UserProfile? _userProfile;
  bool _isLoading = false;
  String? _errorMessage;

  // Filter state
  Map<String, dynamic> _filters = {};
  String? _selectedMealTypeFilter;

  // Browse all recipes state
  List<Recipe> _browseRecipes = [];
  bool _isBrowseLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadUserProfile();
    _loadInitialRecipes();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadUserProfile() async {
    try {
      final profile = await _profileService.getUserProfile();
      if (mounted) {
        setState(() {
          _userProfile = profile;
          // Set initial budget filter from user profile
          if (profile.monthlyBudget != null) {
            _filters['maxCostPerServing'] =
                profile.monthlyBudget! / 30; // Daily budget estimate
          }
        });
      }
    } catch (e) {
      print('Failed to load user profile: $e');
    }
  }

  Future<void> _loadInitialRecipes() async {
    setState(() {
      _isBrowseLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _mealPlannerService.getMealPlannerRecipes(
        pageSize: 20,
      );
      if (mounted) {
        setState(() {
          _browseRecipes = result['recipes'] as List<Recipe>;
          _isBrowseLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isBrowseLoading = false;
        });
      }
    }
  }

  // Used by filter dialog in Step 5
  Future<void> _loadRecipesWithFilters() async {
    setState(() {
      _isBrowseLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _mealPlannerService.getMealPlannerRecipes(
        mealType: _selectedMealTypeFilter,
        minCostPerServing: _filters['minCostPerServing'],
        maxCostPerServing: _filters['maxCostPerServing'],
        minCalories: _filters['minCalories'],
        maxCalories: _filters['maxCalories'],
        minProtein: _filters['minProtein'],
        maxProtein: _filters['maxProtein'],
        minCarbs: _filters['minCarbs'],
        maxCarbs: _filters['maxCarbs'],
        minFat: _filters['minFat'],
        maxFat: _filters['maxFat'],
        minTotalTime: _filters['minTotalTime'],
        maxTotalTime: _filters['maxTotalTime'],
        minDifficultyRating: _filters['minDifficultyRating'],
        maxDifficultyRating: _filters['maxDifficultyRating'],
        minTasteRating: _filters['minTasteRating'],
        maxTasteRating: _filters['maxTasteRating'],
        minHealthRating: _filters['minHealthRating'],
        maxHealthRating: _filters['maxHealthRating'],
        hasImage: _filters['hasImage'],
        isApproved: _filters['approvedOnly'],
        isFeatured: _filters['featuredOnly'],
        excludeAllergens: _filters['excludeAllergens'],
        dietInfo: _filters['dietInfo'],
        pageSize: 50,
      );

      if (mounted) {
        setState(() {
          _browseRecipes = result['recipes'] as List<Recipe>;
          _isBrowseLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isBrowseLoading = false;
        });
      }
    }
  }

  Future<void> _randomizeMealPlan() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final randomPlan = await _mealPlannerService.getRandomDailyMealPlan(
        filters: _filters,
        recipesPerMealType: 1,
      );

      if (mounted) {
        setState(() {
          if (randomPlan['breakfast']!.isNotEmpty) {
            _mealPlan.breakfast = randomPlan['breakfast']![0];
          }
          if (randomPlan['lunch']!.isNotEmpty) {
            _mealPlan.lunch = randomPlan['lunch']![0];
          }
          if (randomPlan['dinner']!.isNotEmpty) {
            _mealPlan.dinner = randomPlan['dinner']![0];
          }
          _isLoading = false;
        });

        _checkForAllergens();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(
                context,
              )!.failedToLoadMealPlanner(e.toString()),
            ),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _checkForAllergens() {
    if (_userProfile == null || _userProfile!.allergens.isEmpty) return;

    final allergens = _mealPlan.getAllAllergens();
    final userAllergens =
        _userProfile!.allergens.map((a) => a.toLowerCase()).toSet();
    final detectedAllergens =
        allergens
            .where((a) => userAllergens.contains(a.toLowerCase()))
            .toList();

    if (detectedAllergens.isNotEmpty && mounted) {
      showDialog(
        context: context,
        builder:
            (context) => AlertDialog(
              title: Text(AppLocalizations.of(context)!.allergenWarning),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(AppLocalizations.of(context)!.allergenDetected),
                  const SizedBox(height: 8),
                  Text(
                    AppLocalizations.of(
                      context,
                    )!.allergenDetectedList(detectedAllergens.join(', ')),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    setState(() {
                      _mealPlan.clearAll();
                    });
                  },
                  child: Text(AppLocalizations.of(context)!.cancel),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(AppLocalizations.of(context)!.continueAnyway),
                ),
              ],
            ),
      );
    }
  }

  Future<void> _generateShoppingList() async {
    if (!_mealPlan.hasRecipes()) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.addRecipesToGenerate),
        ),
      );
      return;
    }

    // Show portion selector dialog
    final portionCount = await _showPortionSelectorDialog();
    if (portionCount == null) return; // User cancelled

    // Show loading
    setState(() {
      _isLoading = true;
    });

    try {
      // Fetch full recipe details for all selected recipes
      final recipeService = RecipeService();
      final List<Recipe> detailedRecipes = [];

      for (var recipe in _mealPlan.getAllRecipes()) {
        final detailedRecipe = await recipeService.getRecipeDetails(recipe.id);
        detailedRecipes.add(detailedRecipe);
      }

      if (mounted) {
        setState(() {
          _shoppingList = ShoppingList.fromRecipes(
            detailedRecipes,
            portionCount: portionCount,
          );
          _isLoading = false;
          _tabController.animateTo(2); // Switch to shopping list tab
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.shoppingListGenerated),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to generate shopping list: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Future<int?> _showPortionSelectorDialog() async {
    int selectedPortion = 1;
    
    return showDialog<int>(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(AppLocalizations.of(context)!.selectPortions),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    AppLocalizations.of(context)!.howManyPortions,
                    style: TextStyle(color: AppTheme.textSecondary),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      IconButton(
                        onPressed: selectedPortion > 1
                            ? () {
                                setDialogState(() {
                                  selectedPortion--;
                                });
                              }
                            : null,
                        icon: const Icon(Icons.remove_circle_outline),
                        iconSize: 36,
                        color: AppTheme.primaryGreen,
                      ),
                      const SizedBox(width: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: AppTheme.primaryGreen,
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '$selectedPortion',
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      IconButton(
                        onPressed: selectedPortion < 10
                            ? () {
                                setDialogState(() {
                                  selectedPortion++;
                                });
                              }
                            : null,
                        icon: const Icon(Icons.add_circle_outline),
                        iconSize: 36,
                        color: AppTheme.primaryGreen,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    AppLocalizations.of(context)!.portionsHelpText,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, null),
                  child: Text(AppLocalizations.of(context)!.cancel),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, selectedPortion),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                  ),
                  child: Text(AppLocalizations.of(context)!.generate),
                ),
              ],
            );
          },
        );
      },
    );
  }

  // Used by recipe selector in Step 6
  void _addRecipeToMealPlan(Recipe recipe, String mealType) {
    // Check for allergens
    if (_userProfile != null && _userProfile!.allergens.isNotEmpty) {
      final userAllergens =
          _userProfile!.allergens.map((a) => a.toLowerCase()).toSet();
      final recipeAllergens =
          recipe.allergens
              .where((a) => userAllergens.contains(a.toLowerCase()))
              .toList();

      if (recipeAllergens.isNotEmpty) {
        showDialog(
          context: context,
          builder:
              (context) => AlertDialog(
                title: Text(AppLocalizations.of(context)!.allergenWarning),
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(AppLocalizations.of(context)!.allergenDetected),
                    const SizedBox(height: 8),
                    Text(
                      AppLocalizations.of(
                        context,
                      )!.allergenDetectedList(recipeAllergens.join(', ')),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.errorColor,
                      ),
                    ),
                  ],
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(AppLocalizations.of(context)!.cancel),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _setMeal(recipe, mealType);
                    },
                    child: Text(AppLocalizations.of(context)!.continueAnyway),
                  ),
                ],
              ),
        );
        return;
      }
    }

    _setMeal(recipe, mealType);
  }

  void _setMeal(Recipe recipe, String mealType) {
    setState(() {
      _mealPlan.setMeal(mealType, recipe);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLocalizations.of(context)!.recipeAddedToPlan),
        backgroundColor: AppTheme.successColor,
      ),
    );
  }

  void _removeMealFromPlan(String mealType) {
    setState(() {
      _mealPlan.clearMeal(mealType);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLocalizations.of(context)!.recipeRemovedFromPlan),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final currencyProvider = Provider.of<CurrencyProvider>(context);

    return Scaffold(
      backgroundColor: AppTheme.backgroundGrey,
      appBar: AppBar(
        title: Text(localizations.mealPlanner),
        backgroundColor: Colors.white,
        elevation: 2,
        actions: [
          IconButton(
            icon: const Icon(Icons.tune),
            onPressed: _showFiltersDialog,
            tooltip: localizations.filters,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: localizations.planToday),
            Tab(text: localizations.browseAllRecipes),
            Tab(text: localizations.shoppingList),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPlanTodayTab(localizations, currencyProvider),
          _buildBrowseAllTab(localizations),
          _buildShoppingListTab(localizations, currencyProvider),
        ],
      ),
    );
  }

  Widget _buildPlanTodayTab(
    AppLocalizations localizations,
    CurrencyProvider currencyProvider,
  ) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header with randomize button
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    localizations.mealPlanSummary,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _isLoading ? null : _randomizeMealPlan,
                  icon: const Icon(Icons.shuffle),
                  label: Text(localizations.randomize),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),

          // Breakfast Section
          _buildMealSection(
            localizations.breakfastSection,
            'breakfast',
            _mealPlan.breakfast,
            localizations,
          ),

          // Lunch Section
          _buildMealSection(
            localizations.lunchSection,
            'lunch',
            _mealPlan.lunch,
            localizations,
          ),

          // Dinner Section
          _buildMealSection(
            localizations.dinnerSection,
            'dinner',
            _mealPlan.dinner,
            localizations,
          ),

          // Total Cost and Generate Button
          if (_mealPlan.hasRecipes())
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            localizations.totalDailyCost,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '${currencyProvider.symbol}${_mealPlan.getTotalCost().toStringAsFixed(2)}',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ],
                      ),
                      if (_userProfile?.monthlyBudget != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          localizations.comparedToMonthlyBudget(
                            '${currencyProvider.symbol}${_userProfile!.monthlyBudget!.toStringAsFixed(2)}',
                          ),
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _generateShoppingList,
                          icon: const Icon(Icons.shopping_cart),
                          label: Text(localizations.generateShoppingList),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryGreen,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.all(32.0),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.restaurant_menu,
                      size: 64,
                      color: Colors.grey[400],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      localizations.noMealPlanYet,
                      style: TextStyle(
                        fontSize: 18,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      localizations.startBySelectingRecipes,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMealSection(
    String title,
    String mealType,
    Recipe? selectedRecipe,
    AppLocalizations localizations,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(_getMealIcon(mealType), color: AppTheme.primaryGreen),
                  const SizedBox(width: 8),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (selectedRecipe != null) ...[
                RecipeCard(recipe: selectedRecipe),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => _removeMealFromPlan(mealType),
                    icon: const Icon(Icons.remove_circle_outline),
                    label: Text(localizations.removeRecipe),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.errorColor,
                    ),
                  ),
                ),
              ] else ...[
                Center(
                  child: ElevatedButton.icon(
                    onPressed: () => _showRecipeSelector(mealType),
                    icon: const Icon(Icons.add),
                    label: Text(localizations.selectRecipe),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  IconData _getMealIcon(String mealType) {
    switch (mealType) {
      case 'breakfast':
        return Icons.wb_sunny;
      case 'lunch':
        return Icons.lunch_dining;
      case 'dinner':
        return Icons.dinner_dining;
      default:
        return Icons.restaurant;
    }
  }

  Widget _buildBrowseAllTab(AppLocalizations localizations) {
    if (_isBrowseLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: AppTheme.errorColor),
            const SizedBox(height: 16),
            Text(
              localizations.failedToLoadMealPlanner(_errorMessage!),
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadInitialRecipes,
              child: Text(localizations.retry),
            ),
          ],
        ),
      );
    }

    if (_browseRecipes.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              localizations.noRecipesFound,
              style: TextStyle(fontSize: 18, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 8),
            Text(
              localizations.tryAdjustingFilters,
              style: TextStyle(fontSize: 14, color: AppTheme.textSecondary),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _browseRecipes.length,
      itemBuilder: (context, index) {
        final recipe = _browseRecipes[index];
        return _buildBrowseRecipeCard(recipe, localizations);
      },
    );
  }

  Widget _buildBrowseRecipeCard(Recipe recipe, AppLocalizations localizations) {
    // Check if recipe is already in meal plan
    final isInBreakfast = _mealPlan.breakfast?.id == recipe.id;
    final isInLunch = _mealPlan.lunch?.id == recipe.id;
    final isInDinner = _mealPlan.dinner?.id == recipe.id;
    final isInPlan = isInBreakfast || isInLunch || isInDinner;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          RecipeCard(recipe: recipe),
          if (!isInPlan) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: PopupMenuButton<String>(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.add_circle, color: Colors.white),
                      const SizedBox(width: 8),
                      Text(
                        localizations.addToMealPlan,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.arrow_drop_down, color: Colors.white),
                    ],
                  ),
                ),
                onSelected: (mealType) {
                  _addRecipeToMealPlan(recipe, mealType);
                },
                itemBuilder:
                    (context) => [
                      PopupMenuItem(
                        value: 'breakfast',
                        child: Row(
                          children: [
                            const Icon(Icons.wb_sunny),
                            const SizedBox(width: 8),
                            Text(localizations.breakfastSection),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'lunch',
                        child: Row(
                          children: [
                            const Icon(Icons.lunch_dining),
                            const SizedBox(width: 8),
                            Text(localizations.lunchSection),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'dinner',
                        child: Row(
                          children: [
                            const Icon(Icons.dinner_dining),
                            const SizedBox(width: 8),
                            Text(localizations.dinnerSection),
                          ],
                        ),
                      ),
                    ],
              ),
            ),
          ] else ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: AppTheme.successColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.successColor),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.check_circle,
                      color: AppTheme.successColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${localizations.addedTo} ${_getRecipeMealType(recipe, localizations)}',
                      style: const TextStyle(
                        color: AppTheme.successColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _getRecipeMealType(Recipe recipe, AppLocalizations localizations) {
    if (_mealPlan.breakfast?.id == recipe.id)
      return localizations.breakfastSection;
    if (_mealPlan.lunch?.id == recipe.id) return localizations.lunchSection;
    if (_mealPlan.dinner?.id == recipe.id) return localizations.dinnerSection;
    return '';
  }

  Widget _buildShoppingListTab(
    AppLocalizations localizations,
    CurrencyProvider currencyProvider,
  ) {
    if (_shoppingList == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.shopping_cart_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              localizations.noIngredientsInList,
              style: TextStyle(fontSize: 18, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 8),
            Text(
              localizations.addRecipesToGenerate,
              style: TextStyle(fontSize: 14, color: AppTheme.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    final allChecked = _shoppingList!.items.every((item) => item.isChecked);

    return Column(
      children: [
        // Portion Count Info Card
        if (_shoppingList!.portionCount > 1)
          Container(
            margin: const EdgeInsets.all(16.0),
            padding: const EdgeInsets.all(12.0),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: AppTheme.primaryGreen.withOpacity(0.3),
              ),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.people,
                  color: AppTheme.primaryGreen,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  localizations.shoppingListForPortions(
                    _shoppingList!.portionCount.toString(),
                  ),
                  style: const TextStyle(
                    color: AppTheme.primaryGreen,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        
        // Select/Deselect All Button
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    setState(() {
                      final shouldCheck = !allChecked;
                      for (var item in _shoppingList!.items) {
                        item.isChecked = shouldCheck;
                      }
                    });
                  },
                  icon: Icon(
                    allChecked
                        ? Icons.check_box_outline_blank
                        : Icons.check_box,
                  ),
                  label: Text(
                    allChecked
                        ? localizations.deselectAll
                        : localizations.selectAll,
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primaryGreen,
                    side: const BorderSide(color: AppTheme.primaryGreen),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Text(
                localizations.checkedItems(
                  _shoppingList!.getCheckedItemsCount().toString(),
                  _shoppingList!.items.length.toString(),
                ),
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
              ),
            ],
          ),
        ),

        Expanded(
          child: ListView.builder(
            itemCount: _shoppingList!.items.length,
            itemBuilder: (context, index) {
              final item = _shoppingList!.items[index];
              final translatedName = translateIngredient(
                context,
                item.ingredientName,
              );
              return CheckboxListTile(
                title: Text(translatedName),
                subtitle: Text(
                  '${item.quantity} ${translateUnit(context, item.unit)}',
                ),
                value: item.isChecked,
                onChanged: (bool? value) {
                  setState(() {
                    item.isChecked = value ?? false;
                  });
                },
              );
            },
          ),
        ),
        Container(
          padding: const EdgeInsets.all(16.0),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    localizations.totalCost,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '${currencyProvider.symbol}${_shoppingList!.totalCost.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryGreen,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _shareShoppingList(currencyProvider),
                  icon: const Icon(Icons.share),
                  label: Text(localizations.shareShoppingList),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showFiltersDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (context) => MealPlannerFilterPanel(
            initialFilters: _filters,
            selectedMealType: _selectedMealTypeFilter,
            onApplyFilters: (filters, mealType) {
              setState(() {
                _filters = filters;
                _selectedMealTypeFilter = mealType;
              });
              _loadRecipesWithFilters();
            },
            onResetFilters: () {
              setState(() {
                _filters.clear();
                _selectedMealTypeFilter = null;
              });
              _loadInitialRecipes();
            },
          ),
    );
  }

  void _showRecipeSelector(String mealType) {
    showDialog(
      context: context,
      builder:
          (context) => RecipeSelectorDialog(
            mealType: mealType,
            filters: _filters,
            onRecipeSelected: (recipe) {
              _addRecipeToMealPlan(recipe, mealType);
            },
          ),
    );
  }

  Future<void> _shareShoppingList(CurrencyProvider currencyProvider) async {
    if (_shoppingList == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.noIngredientsInList),
        ),
      );
      return;
    }

    final localizations = AppLocalizations.of(context)!;

    // Format the date according to user's preference
    final formattedDate =
        _userProfile != null
            ? DateFormatter.formatDate(
              _shoppingList!.createdAt,
              preferredFormat: _userProfile!.preferredDateFormat,
              includeTime: true,
            )
            : DateFormatter.formatDate(
              _shoppingList!.createdAt,
              includeTime: true,
            );

    // Create a translated copy of the shopping list for export
    final translatedItems =
        _shoppingList!.items.map((item) {
          final translatedName = translateIngredient(
            context,
            item.ingredientName,
          );
          final translatedUnit = translateUnit(context, item.unit);
          return item.copyWith(
            ingredientName: translatedName,
            unit: translatedUnit,
          );
        }).toList();

    final translatedShoppingList = _shoppingList!.copyWith(
      items: translatedItems,
    );

    // Generate plain text format with localized labels
    final text = translatedShoppingList.toPlainText(
      currencySymbol: currencyProvider.symbol,
      formattedDate: formattedDate,
      titleLabel: localizations.shoppingListExportTitle,
      generatedLabel: localizations.generatedLabel,
      recipesLabel: localizations.recipesLabel,
      ingredientsLabel: localizations.ingredientsExportLabel,
      itemsLabel:
          localizations.itemsCount('').replaceAll(RegExp(r'\d+'), '').trim(),
      totalCostLabel: localizations.totalCost,
      costByRetailerLabel: localizations.costByRetailerLabel,
      bestLabel: localizations.bestRetailerLabel,
      portionsLabel: localizations.portions,
      footerLabel: localizations.generatedByFitHub,
    );

    try {
      // Try to share using the system share dialog
      await Share.share(
        text,
        subject: AppLocalizations.of(context)!.shoppingList,
      );

      // Show success message after sharing
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.shoppingListShared),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      // Fallback: Copy to clipboard if share fails (e.g., on emulator)
      if (e.toString().contains('MissingPluginException')) {
        try {
          await Clipboard.setData(ClipboardData(text: text));

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Shopping list copied to clipboard!'),
                backgroundColor: AppTheme.successColor,
              ),
            );
          }
        } catch (clipboardError) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  '${AppLocalizations.of(context)!.failedToShareShoppingList}: $clipboardError',
                ),
                backgroundColor: AppTheme.errorColor,
              ),
            );
          }
        }
      } else {
        // Other errors
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                '${AppLocalizations.of(context)!.failedToShareShoppingList}: $e',
              ),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      }
    }
  }
}

import 'package:flutter/material.dart';
import '../models/recipe.dart';
import '../services/meal_planner_service.dart';
import '../widgets/recipe_card.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';

class RecipeSelectorDialog extends StatefulWidget {
  final String mealType;
  final Map<String, dynamic> filters;
  final Function(Recipe) onRecipeSelected;

  const RecipeSelectorDialog({
    Key? key,
    required this.mealType,
    required this.filters,
    required this.onRecipeSelected,
  }) : super(key: key);

  @override
  State<RecipeSelectorDialog> createState() => _RecipeSelectorDialogState();
}

class _RecipeSelectorDialogState extends State<RecipeSelectorDialog> {
  final MealPlannerService _mealPlannerService = MealPlannerService();
  List<Recipe> _recipes = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadRecipes();
  }

  Future<void> _loadRecipes() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _mealPlannerService.getMealPlannerRecipes(
        mealType: widget.mealType,
        minCostPerServing: widget.filters['minCostPerServing'],
        maxCostPerServing: widget.filters['maxCostPerServing'],
        minCalories: widget.filters['minCalories'],
        maxCalories: widget.filters['maxCalories'],
        minProtein: widget.filters['minProtein'],
        maxProtein: widget.filters['maxProtein'],
        minCarbs: widget.filters['minCarbs'],
        maxCarbs: widget.filters['maxCarbs'],
        minFat: widget.filters['minFat'],
        maxFat: widget.filters['maxFat'],
        minTotalTime: widget.filters['minTotalTime'],
        maxTotalTime: widget.filters['maxTotalTime'],
        minDifficultyRating: widget.filters['minDifficultyRating'],
        maxDifficultyRating: widget.filters['maxDifficultyRating'],
        minTasteRating: widget.filters['minTasteRating'],
        maxTasteRating: widget.filters['maxTasteRating'],
        minHealthRating: widget.filters['minHealthRating'],
        maxHealthRating: widget.filters['maxHealthRating'],
        hasImage: widget.filters['hasImage'],
        isApproved: true,
        pageSize: 50,
      );

      if (mounted) {
        setState(() {
          _recipes = result['recipes'] as List<Recipe>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  String _getMealTypeTitle(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    switch (widget.mealType) {
      case 'breakfast':
        return localizations.breakfastSection;
      case 'lunch':
        return localizations.lunchSection;
      case 'dinner':
        return localizations.dinnerSection;
      default:
        return localizations.selectRecipe;
    }
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;

    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.max,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    '${localizations.selectRecipe} - ${_getMealTypeTitle(context)}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: _buildContent(localizations),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(AppLocalizations localizations) {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(localizations.loadingRecipes),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: AppTheme.errorColor,
              ),
              const SizedBox(height: 16),
              Text(
                localizations.failedToLoadMealPlanner(_errorMessage!),
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadRecipes,
                child: Text(localizations.retry),
              ),
            ],
          ),
        ),
      );
    }

    if (_recipes.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.search_off,
                size: 64,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 16),
              Text(
                localizations.noRecipesForMealType,
                style: const TextStyle(
                  fontSize: 18,
                  color: AppTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                localizations.tryAdjustingFilters,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      itemCount: _recipes.length,
      padding: const EdgeInsets.all(8),
      itemBuilder: (context, index) {
        final recipe = _recipes[index];
        return GestureDetector(
          onTap: () {
            widget.onRecipeSelected(recipe);
            Navigator.pop(context);
          },
          child: Card(
            margin: const EdgeInsets.symmetric(vertical: 4),
            child: Column(
              children: [
                RecipeCard(recipe: recipe),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        widget.onRecipeSelected(recipe);
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.add_circle),
                      label: Text(localizations.addToMealPlan),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryGreen,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}


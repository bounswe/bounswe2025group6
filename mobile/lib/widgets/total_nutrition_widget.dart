import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';
import '../utils/nutrition_icon_helper.dart';

/// Widget to display total nutritional information for a recipe
/// Shows calories, protein, fat, and carbs in a prominent card
/// Icons dynamically adapt based on nutrition values
class TotalNutritionWidget extends StatelessWidget {
  final Map<String, dynamic>? recipeNutritions;
  final String? title;
  final String? subtitle;

  const TotalNutritionWidget({
    Key? key,
    required this.recipeNutritions,
    this.title,
    this.subtitle,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (recipeNutritions == null) {
      return const SizedBox.shrink();
    }

    final caloriesValue = NutritionIconHelper.parseValue(
      recipeNutritions!['calories'],
    );
    final proteinValue = NutritionIconHelper.parseValue(
      recipeNutritions!['protein'],
    );
    final fatValue = NutritionIconHelper.parseValue(recipeNutritions!['fat']);
    final carbsValue = NutritionIconHelper.parseValue(
      recipeNutritions!['carbs'],
    );

    final calories = _parseValue(recipeNutritions!['calories']);
    final protein = _parseValue(recipeNutritions!['protein']);
    final fat = _parseValue(recipeNutritions!['fat']);
    final carbs = _parseValue(recipeNutritions!['carbs']);

    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.restaurant_menu,
                      color: AppTheme.primaryGreen,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title ?? AppLocalizations.of(context)!.nutritionFacts,
                          style: Theme.of(
                            context,
                          ).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                        if (subtitle != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            subtitle!,
                            style: TextStyle(
                              fontSize: 11,
                              color: AppTheme.textSecondary,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Nutrition Grid - Dynamic icons based on values
              Row(
                children: [
                  Expanded(
                    child: _buildDynamicNutrientCard(
                      context,
                      'calories',
                      AppLocalizations.of(context)!.calories,
                      calories,
                      AppLocalizations.of(context)!.kcal,
                      caloriesValue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildDynamicNutrientCard(
                      context,
                      'protein',
                      AppLocalizations.of(context)!.protein,
                      protein,
                      AppLocalizations.of(context)!.grams,
                      proteinValue,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildDynamicNutrientCard(
                      context,
                      'fat',
                      AppLocalizations.of(context)!.fat,
                      fat,
                      AppLocalizations.of(context)!.grams,
                      fatValue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildDynamicNutrientCard(
                      context,
                      'carbs',
                      AppLocalizations.of(context)!.carbs,
                      carbs,
                      AppLocalizations.of(context)!.grams,
                      carbsValue,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Builds a dynamic nutrient card with icons that adapt to value intensity
  Widget _buildDynamicNutrientCard(
    BuildContext context,
    String type,
    String label,
    String value,
    String unit,
    double numericValue,
  ) {
    final color = NutritionIconHelper.getColor(type, numericValue);
    final emoji = NutritionIconHelper.getEmoji(type, numericValue);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Column(
        children: [
          // Dynamic emoji row based on intensity (centered, no overflow)
          Text(emoji, style: TextStyle(fontSize: 22)),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            unit,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.black54,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  String _parseValue(dynamic value) {
    if (value == null) return '0';
    if (value is num) {
      return value.toStringAsFixed(1);
    }
    final parsed = double.tryParse(value.toString());
    return parsed?.toStringAsFixed(1) ?? '0';
  }
}

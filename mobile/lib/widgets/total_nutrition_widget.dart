import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';

/// Widget to display total nutritional information for a recipe
/// Shows calories, protein, fat, and carbs in a prominent card
class TotalNutritionWidget extends StatelessWidget {
  final Map<String, dynamic>? recipeNutritions;
  final String? title;

  const TotalNutritionWidget({
    Key? key,
    required this.recipeNutritions,
    this.title,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (recipeNutritions == null) {
      return const SizedBox.shrink();
    }

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
                    child: Text(
                      title ?? AppLocalizations.of(context)!.nutritionFacts,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Nutrition Grid
              Row(
                children: [
                  Expanded(
                    child: _buildNutrientCard(
                      context,
                      Icons.local_fire_department,
                      AppLocalizations.of(context)!.calories,
                      calories,
                      AppLocalizations.of(context)!.kcal,
                      Colors.orange,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildNutrientCard(
                      context,
                      Icons.fitness_center,
                      AppLocalizations.of(context)!.protein,
                      protein,
                      AppLocalizations.of(context)!.grams,
                      Colors.red,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildNutrientCard(
                      context,
                      Icons.opacity,
                      AppLocalizations.of(context)!.fat,
                      fat,
                      AppLocalizations.of(context)!.grams,
                      Colors.yellow.shade700,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildNutrientCard(
                      context,
                      Icons.grass,
                      AppLocalizations.of(context)!.carbs,
                      carbs,
                      AppLocalizations.of(context)!.grams,
                      Colors.green,
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

  Widget _buildNutrientCard(
    BuildContext context,
    IconData icon,
    String label,
    String value,
    String unit,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Column(
        children: [
          Icon(icon, size: 28, color: color),
          const SizedBox(height: 8),
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

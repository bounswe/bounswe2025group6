import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';

/// Widget to display nutritional information for an ingredient
/// Shows calories, protein, fat, and carbs in a compact card format
class IngredientNutritionCard extends StatelessWidget {
  final Map<String, dynamic>? nutritionInfo;
  final bool isCompact;

  const IngredientNutritionCard({
    Key? key,
    required this.nutritionInfo,
    this.isCompact = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (nutritionInfo == null) {
      return const SizedBox.shrink();
    }

    final calories = _parseValue(nutritionInfo!['calories']);
    final protein = _parseValue(nutritionInfo!['protein']);
    final fat = _parseValue(nutritionInfo!['fat']);
    final carbs = _parseValue(nutritionInfo!['carbs']);

    if (isCompact) {
      return _buildCompactView(context, calories, protein, fat, carbs);
    }

    return _buildDetailedView(context, calories, protein, fat, carbs);
  }

  Widget _buildCompactView(
    BuildContext context,
    String calories,
    String protein,
    String fat,
    String carbs,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.primaryGreen.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildNutrientChip(Icons.local_fire_department, calories, 'kcal'),
          const SizedBox(width: 8),
          _buildNutrientChip(Icons.fitness_center, protein, 'P'),
          const SizedBox(width: 8),
          _buildNutrientChip(Icons.opacity, fat, 'F'),
          const SizedBox(width: 8),
          _buildNutrientChip(Icons.grass, carbs, 'C'),
        ],
      ),
    );
  }

  Widget _buildDetailedView(
    BuildContext context,
    String calories,
    String protein,
    String fat,
    String carbs,
  ) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.primaryGreen.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppTheme.primaryGreen.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.restaurant_menu,
                size: 16,
                color: AppTheme.primaryGreen,
              ),
              const SizedBox(width: 4),
              Text(
                'Nutrition Info',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primaryGreen,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildNutrientDetail(
                context,
                Icons.local_fire_department,
                AppLocalizations.of(context)!.calories,
                calories,
                AppLocalizations.of(context)!.kcal,
              ),
              _buildNutrientDetail(
                context,
                Icons.fitness_center,
                AppLocalizations.of(context)!.protein,
                protein,
                AppLocalizations.of(context)!.grams,
              ),
              _buildNutrientDetail(
                context, 
                Icons.opacity, 
                AppLocalizations.of(context)!.fat, 
                fat, 
                AppLocalizations.of(context)!.grams,
              ),
              _buildNutrientDetail(
                context, 
                Icons.grass, 
                AppLocalizations.of(context)!.carbs, 
                carbs, 
                AppLocalizations.of(context)!.grams,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNutrientChip(IconData icon, String value, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppTheme.primaryGreen),
        const SizedBox(width: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        Text(label, style: TextStyle(fontSize: 10, color: Colors.black54)),
      ],
    );
  }

  Widget _buildNutrientDetail(
    BuildContext context,
    IconData icon,
    String label,
    String value,
    String unit,
  ) {
    return Column(
      children: [
        Icon(icon, size: 20, color: AppTheme.primaryGreen),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        Text(
          unit,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: Colors.black54, fontSize: 10),
        ),
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: Colors.black54, fontSize: 9),
        ),
      ],
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

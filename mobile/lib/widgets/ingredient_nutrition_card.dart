import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';
import '../utils/nutrition_icon_helper.dart';

/// Widget to display nutritional information for an ingredient
/// Shows calories, protein, fat, and carbs in a compact card format
/// Icons dynamically adapt based on nutrition values
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

    // Parse numeric values for dynamic icons
    final caloriesNum = NutritionIconHelper.parseValue(
      nutritionInfo!['calories'],
    );
    final proteinNum = NutritionIconHelper.parseValue(
      nutritionInfo!['protein'],
    );
    final fatNum = NutritionIconHelper.parseValue(nutritionInfo!['fat']);
    final carbsNum = NutritionIconHelper.parseValue(nutritionInfo!['carbs']);

    if (isCompact) {
      return _buildCompactView(
        context,
        calories,
        protein,
        fat,
        carbs,
        caloriesNum,
        proteinNum,
        fatNum,
        carbsNum,
      );
    }

    return _buildDetailedView(
      context,
      calories,
      protein,
      fat,
      carbs,
      caloriesNum,
      proteinNum,
      fatNum,
      carbsNum,
    );
  }

  Widget _buildCompactView(
    BuildContext context,
    String calories,
    String protein,
    String fat,
    String carbs,
    double caloriesNum,
    double proteinNum,
    double fatNum,
    double carbsNum,
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
          _buildDynamicNutrientChip('calories', calories, 'kcal', caloriesNum),
          const SizedBox(width: 8),
          _buildDynamicNutrientChip('protein', protein, 'P', proteinNum),
          const SizedBox(width: 8),
          _buildDynamicNutrientChip('fat', fat, 'F', fatNum),
          const SizedBox(width: 8),
          _buildDynamicNutrientChip('carbs', carbs, 'C', carbsNum),
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
    double caloriesNum,
    double proteinNum,
    double fatNum,
    double carbsNum,
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
              _buildDynamicNutrientDetail(
                context,
                'calories',
                AppLocalizations.of(context)!.calories,
                calories,
                AppLocalizations.of(context)!.kcal,
                caloriesNum,
              ),
              _buildDynamicNutrientDetail(
                context,
                'protein',
                AppLocalizations.of(context)!.protein,
                protein,
                AppLocalizations.of(context)!.grams,
                proteinNum,
              ),
              _buildDynamicNutrientDetail(
                context,
                'fat',
                AppLocalizations.of(context)!.fat,
                fat,
                AppLocalizations.of(context)!.grams,
                fatNum,
              ),
              _buildDynamicNutrientDetail(
                context,
                'carbs',
                AppLocalizations.of(context)!.carbs,
                carbs,
                AppLocalizations.of(context)!.grams,
                carbsNum,
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Dynamic nutrient chip with emoji based on intensity
  Widget _buildDynamicNutrientChip(
    String type,
    String value,
    String label,
    double numericValue,
  ) {
    final color = NutritionIconHelper.getColor(type, numericValue);
    final emoji = NutritionIconHelper.getCompactEmoji(type, numericValue);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(emoji, style: const TextStyle(fontSize: 11)),
        const SizedBox(width: 1),
        Text(
          value,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
        Text(label, style: TextStyle(fontSize: 9, color: Colors.black54)),
      ],
    );
  }

  /// Dynamic nutrient detail with emoji based on intensity
  Widget _buildDynamicNutrientDetail(
    BuildContext context,
    String type,
    String label,
    String value,
    String unit,
    double numericValue,
  ) {
    final color = NutritionIconHelper.getColor(type, numericValue);
    final emoji = NutritionIconHelper.getCompactEmoji(type, numericValue);

    return Column(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 16)),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: color,
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
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: color.withOpacity(0.8),
            fontSize: 9,
          ),
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

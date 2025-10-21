import 'package:flutter/widgets.dart';
import '../l10n/app_localizations.dart';

/// Returns a localized human-readable label for a backend tag value.
///
/// The backend stores canonical English tag values (e.g. 'Budget'). This
/// helper maps those values to localized strings for display in the UI.
String localizedTagLabel(BuildContext context, String tag) {
  final loc = AppLocalizations.of(context)!;
  switch (tag) {
    case 'Budget':
      return loc.tagBudget;
    case 'Meal Prep':
      return loc.tagMealPrep;
    case 'Family':
      return loc.tagFamily;
    case 'No Waste':
      return loc.tagNoWaste;
    case 'Sustainability':
      return loc.tagSustainability;
    case 'Tips':
      return loc.tagTips;
    case 'Gluten Free':
      return loc.tagGlutenFree;
    case 'Vegan':
      return loc.tagVegan;
    case 'Vegetarian':
      return loc.tagVegetarian;
    case 'Quick':
      return loc.tagQuick;
    case 'Healthy':
      return loc.tagHealthy;
    case 'Student':
      return loc.tagStudent;
    case 'Nutrition':
      return loc.tagNutrition;
    case 'Healthy Eating':
      return loc.tagHealthyEating;
    case 'Snacks':
      return loc.tagSnacks;
    default:
      return tag;
  }
}

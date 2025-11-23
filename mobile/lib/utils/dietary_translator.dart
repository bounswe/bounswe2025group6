import 'package:flutter/widgets.dart';
import 'package:fithub/l10n/app_localizations.dart';

/// Translates backend dietary info strings into localized display strings.
/// Keeps the backend value unchanged (so callers can continue to
/// store/send the raw value) while providing localized labels for UI.
///
/// Backend format examples:
/// - "high-protein", "high_protein", "highprotein"
/// - "gluten-free", "gluten_free", "glutenfree"
/// - "low-carbohydrate", "low_carbohydrate"
/// - "vegetarian", "vegan", "keto", "paleo", "pescatarian"
String translateDietaryInfo(BuildContext context, String backendDietaryInfo) {
  final loc = AppLocalizations.of(context);
  if (loc == null) return backendDietaryInfo;

  // Normalize backend value: trim, lowercase, replace underscores with nothing
  var key = backendDietaryInfo.trim().toLowerCase();
  // Remove all non-alphanumeric characters (including hyphens and underscores)
  key = key.replaceAll(RegExp(r'[^a-z0-9]'), '');

  // Map normalized backend keys to localization strings
  // All variations (with hyphens, underscores, or no separator) are normalized to no separator
  final map = <String, String>{
    // High protein variations
    'highprotein': loc.dietaryHighProtein,

    // Low carbohydrate variations
    'lowcarbohydrate': loc.dietaryLowCarbohydrate,
    'lowcarb': loc.dietaryLowCarbohydrate,

    // Standard dietary preferences
    'vegetarian': loc.dietaryVegetarian,
    'vegan': loc.dietaryVegan,
    'glutenfree': loc.dietaryGlutenFree,
    'keto': loc.dietaryKeto,
    'paleo': loc.dietaryPaleo,
    'pescatarian': loc.dietaryPescatarian,

    // Fallback for unrecognized tags - just capitalize the first letter
  };

  // Return translated value if found, otherwise return original (capitalized)
  if (map.containsKey(key)) {
    return map[key]!;
  }

  // Fallback: capitalize first letter of original string for unknown tags
  if (backendDietaryInfo.isNotEmpty) {
    return backendDietaryInfo[0].toUpperCase() +
        backendDietaryInfo.substring(1);
  }

  return backendDietaryInfo;
}

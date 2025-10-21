import 'package:flutter/widgets.dart';
import '../l10n/app_localizations.dart';

/// Returns a localized label for a meal type value (e.g. 'breakfast', 'lunch', 'dinner').
/// If the value is null or unknown, returns a localized 'not set' or the raw value as fallback.
String localizeMealType(String? mealType, BuildContext context) {
  final loc = AppLocalizations.of(context)!;
  if (mealType == null || mealType.isEmpty) return loc.notSet;

  switch (mealType.toLowerCase()) {
    case 'breakfast':
      return loc.breakfast;
    case 'lunch':
      return loc.lunch;
    case 'dinner':
      return loc.dinner;
    // Add more mappings if your backend uses other identifiers
    default:
      // Try to return the raw value capitalized as a reasonable fallback
      return mealType[0].toUpperCase() + mealType.substring(1);
  }
}

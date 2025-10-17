import 'package:flutter/widgets.dart';
import '../l10n/app_localizations.dart';

/// Returns a localized label for dietary preferences and allergens (used in chips).
String localizedItemLabel(BuildContext context, String item) {
  final loc = AppLocalizations.of(context)!;
  switch (item) {
    case 'Vegetarian':
      return loc.dietaryVegetarian;
    case 'Vegan':
      return loc.dietaryVegan;
    case 'Gluten-Free':
      return loc.dietaryGlutenFree;
    case 'Keto':
      return loc.dietaryKeto ?? item;
    case 'Paleo':
      return loc.dietaryPaleo ?? item;
    case 'Pescatarian':
      return loc.dietaryPescatarian ?? item;

    case 'Peanuts':
      return loc.allergenPeanuts ?? item;
    case 'Dairy':
      return loc.allergenDairy ?? item;
    case 'Soy':
      return loc.allergenSoy ?? item;
    case 'Shellfish':
      return loc.allergenShellfish ?? item;
    case 'Tree Nuts':
      return loc.allergenTreeNuts ?? item;
    case 'Wheat':
      return loc.allergenWheat ?? item;

    default:
      return item;
  }
}

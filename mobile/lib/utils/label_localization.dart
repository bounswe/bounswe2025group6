import 'package:flutter/widgets.dart';
import '../l10n/app_localizations.dart';
import '../models/user_profile.dart';

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

/// Localized label for [Currency]
String localizedCurrencyLabel(BuildContext context, Currency currency) {
  final loc = AppLocalizations.of(context)!;
  switch (currency) {
    case Currency.usd:
      return loc.currencyUsd ?? 'USD';
    case Currency.try_:
      return loc.currencyTry ?? 'TRY';
  }
}

/// Localized label for [DateFormat]
String localizedDateFormatLabel(BuildContext context, DateFormat format) {
  final loc = AppLocalizations.of(context)!;
  switch (format) {
    case DateFormat.mmddyyyy:
      return loc.dateFormatMmddyyyy ?? format.displayName;
    case DateFormat.ddmmyyyy:
      return loc.dateFormatDdmmyyyy ?? format.displayName;
    case DateFormat.yyyymmdd:
      return loc.dateFormatYyyymmdd ?? format.displayName;
  }
}

/// Localized label for [AccessibilityNeeds]
String localizedAccessibilityLabel(BuildContext context, AccessibilityNeeds needs) {
  final loc = AppLocalizations.of(context)!;
  switch (needs) {
    case AccessibilityNeeds.none:
      return loc.accessibilityNone ?? 'None';
    case AccessibilityNeeds.colorblind:
      return loc.accessibilityColorblind ?? 'Colorblind';
    case AccessibilityNeeds.visual:
      return loc.accessibilityVisual ?? 'Visual Impairment';
    case AccessibilityNeeds.hearing:
      return loc.accessibilityHearing ?? 'Hearing Impairment';
  }
}

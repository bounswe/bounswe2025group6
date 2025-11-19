import 'package:flutter/widgets.dart';
import 'package:fithub/l10n/app_localizations.dart';

/// Translates backend unit strings into localized display strings.
/// Keeps the backend unit value unchanged (so callers can continue to
/// store/send the raw value) while providing localized labels for UI.
String translateUnit(BuildContext context, String backendUnit) {
  final loc = AppLocalizations.of(context);
  final key = backendUnit.trim().toLowerCase();

  final map = <String, String>{
    'g': loc?.grams ?? 'g',
    'kg': loc?.kg ?? 'kg',
    'ml': loc?.ml ?? 'ml',
    'l': loc?.l ?? 'l',
    'pcs': loc?.pcs ?? 'pcs',
    'cup': loc?.cup ?? 'cup',
    'tbsp': loc?.tbsp ?? 'tbsp',
    'tsp': loc?.tsp ?? 'tsp',
  };

  return map[key] ?? backendUnit;
}

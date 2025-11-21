import 'package:flutter/widgets.dart';
import 'package:fithub/l10n/app_localizations.dart';

/// Translates backend ingredient names using AppLocalizations.
/// Falls back to the original backend name if no translation key exists.
///
/// Normalization rules:
/// - trim
/// - lowercase
/// - spaces -> underscores
/// - strip characters outside [a-z0-9_ ] (defensive)
String translateIngredient(BuildContext context, String backendName) {
  final loc = AppLocalizations.of(context);
  if (loc == null) return backendName;

  final key = _normalizeToKey(backendName);
  final translations = <String, String>{
    'almond_milk': loc.almond_milk,
    'apple': loc.apple,
    'bacon': loc.bacon,
    'banana': loc.banana,
    'basil': loc.basil,
    'bell_pepper': loc.bell_pepper,
    'black_pepper': loc.black_pepper,
    'broccoli': loc.broccoli,
    'brown_rice': loc.brown_rice,
    'butter': loc.butter,
    'canola_oil': loc.canola_oil,
    'carrot': loc.carrot,
    'cheddar_cheese': loc.cheddar_cheese,
    'chicken_breast': loc.chicken_breast,
    'cinnamon': loc.cinnamon,
    'coconut_oil': loc.coconut_oil,
    'cucumber': loc.cucumber,
    'eggplant': loc.eggplant,
    'eggs': loc.eggs,
    'garlic': loc.garlic,
    'greek_yogurt': loc.greek_yogurt,
    'ground_beef': loc.ground_beef,
    'lemon': loc.lemon,
    'lettuce': loc.lettuce,
    'milk': loc.milk,
    'mozzarella': loc.mozzarella,
    'olive_oil': loc.olive_oil,
    'onion': loc.onion,
    'oregano': loc.oregano,
    'parmesan': loc.parmesan,
    'potato': loc.potato,
    'quinoa': loc.quinoa,
    'rice': loc.rice,
    'rosemary': loc.rosemary,
    'salmon_fillet': loc.salmon_fillet,
    'salt': loc.salt,
    'soy_milk': loc.soy_milk,
    'spinach': loc.spinach,
    'strawberries': loc.strawberries,
    'sweet_potato': loc.sweet_potato,
    'thyme': loc.thyme,
    'tofu': loc.tofu,
    'tomato': loc.tomato,
    'turkey_breast': loc.turkey_breast,
    'vegetable_oil': loc.vegetable_oil,
    'whole_wheat_bread': loc.whole_wheat_bread,
    'zucchini': loc.zucchini,
    'almonds': loc.almonds,
    'apricot': loc.apricot,
    'asparagus': loc.asparagus,
    'avocado': loc.avocado,
    'barley': loc.barley,
    'beets': loc.beets,
    'black_beans': loc.black_beans,
    'blueberries': loc.blueberries,
    'brussels_sprouts': loc.brussels_sprouts,
    'cabbage': loc.cabbage,
    'cauliflower': loc.cauliflower,
    'celery': loc.celery,
    'chia_seeds': loc.chia_seeds,
    'chickpeas': loc.chickpeas,
    'cilantro': loc.cilantro,
    'cranberries': loc.cranberries,
    'cumin': loc.cumin,
    'dates': loc.dates,
    'feta_cheese': loc.feta_cheese,
    'flax_seeds': loc.flax_seeds,
    'green_beans': loc.green_beans,
    'kale': loc.kale,
    'lentils': loc.lentils,
    'lime': loc.lime,
    'mushrooms': loc.mushrooms,
    'oats': loc.oats,
    'peanuts': loc.peanuts,
    'pineapple': loc.pineapple,
    'pumpkin': loc.pumpkin,
    'raspberries': loc.raspberries,
    'artichoke': loc.artichoke,
    'balsamic_vinegar': loc.balsamic_vinegar,
    'canned_tuna': loc.canned_tuna,
    'chocolate_chips': loc.chocolate_chips,
    'cloves': loc.cloves,
    'coleslaw_mix': loc.coleslaw_mix,
    'cream': loc.cream,
    'dill': loc.dill,
    'frozen_spinach': loc.frozen_spinach,
    'ginger': loc.ginger,
    'green_onion': loc.green_onion,
    'ham': loc.ham,
    'hardboiled_eggs': loc.hardboiled_eggs,
    'iceberg_lettuce': loc.iceberg_lettuce,
    'jam': loc.jam,
    'jasmine_rice': loc.jasmine_rice,
    'kidney_beans': loc.kidney_beans,
    'leek': loc.leek,
    'maple_syrup': loc.maple_syrup,
    'yellow_onion': loc.yellow_onion,
    'bread': loc.bread,
    'flour': loc.flour,
    'pasta': loc.pasta,
    'water': loc.water,
  };

  return translations[key] ?? backendName;
}

/// Converts a backend ingredient name into a localization key.
/// Example: "Olive Oil" -> "olive_oil", "Brown Sugar" -> "brown_sugar".
String _normalizeToKey(String raw) {
  var s = raw.trim().toLowerCase();
  s = s.replaceAll(RegExp(r'[^a-z0-9 _]'), '');
  s = s.replaceAll(RegExp(r'\s+'), ' ');
  s = s.replaceAll(' ', '_');
  return s;
}

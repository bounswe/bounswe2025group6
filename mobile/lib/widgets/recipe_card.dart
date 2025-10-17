import 'package:flutter/material.dart';
import '../models/recipe.dart';
import '../screens/recipe_detail_screen.dart'; 
import '../l10n/app_localizations.dart';
import '../utils/meal_type_localization.dart';

class RecipeCard extends StatelessWidget {
  final Recipe recipe;

  const RecipeCard({Key? key, required this.recipe}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        title: Text(recipe.name),
        subtitle: Text(
          '${AppLocalizations.of(context)!.mealTypeLabel}: ${localizeMealType(recipe.mealType, context)} | ${AppLocalizations.of(context)!.totalTimeLabel}: ${recipe.totalTime} ${AppLocalizations.of(context)!.minutesAbbr}',
        ),
        // TODO: Add more details like image, cost, ratings
        onTap: () {
          // Navigate to RecipeDetailScreen
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => RecipeDetailScreen(recipeId: recipe.id),
            ),
          );
        },
      ),
    );
  }
}

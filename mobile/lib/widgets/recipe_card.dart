import 'package:flutter/material.dart';
import '../models/recipe.dart';
import '../screens/recipe_detail_screen.dart'; 
import '../l10n/app_localizations.dart';

class RecipeCard extends StatelessWidget {
  final Recipe recipe;

  const RecipeCard({Key? key, required this.recipe}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        title: Text(recipe.name),
        // Previous hard-coded subtitle:
        // 'Meal Type: ${recipe.mealType} | Total Time: ${recipe.totalTime} mins'
        subtitle: Text(
          '${AppLocalizations.of(context)!.mealTypeLabel}: ${recipe.mealType} | ${AppLocalizations.of(context)!.totalTimeLabel}: ${recipe.totalTime} ${AppLocalizations.of(context)!.minutesAbbr}',
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

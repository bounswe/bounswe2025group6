import 'package:flutter/material.dart';
import '../models/recipe.dart';

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
          'Meal Type: ${recipe.mealType} | Total Time: ${recipe.totalTime} mins',
        ),
        // TODO: Add more details like image, cost, ratings
        // onTap: () {
        //   // Navigate to RecipeDetailScreen
        //   // Navigator.push(context, MaterialPageRoute(builder: (context) => RecipeDetailScreen(recipeId: recipe.id)));
        // },
      ),
    );
  }
}

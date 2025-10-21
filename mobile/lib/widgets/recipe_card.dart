import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/recipe.dart';
import '../providers/currency_provider.dart';
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
      clipBehavior: Clip.antiAlias,
      elevation: 2,
      child: InkWell(
        onTap: () {
          // Navigate to RecipeDetailScreen
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => RecipeDetailScreen(recipeId: recipe.id),
            ),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Recipe Image
            if (recipe.imageFullUrl != null && recipe.imageFullUrl!.isNotEmpty)
              ConstrainedBox(
                constraints: const BoxConstraints(
                  maxHeight: 200,
                  minHeight: 150,
                ),
                child: Container(
                  width: double.infinity,
                  color: Colors.grey[100],
                  child: Image.network(
                    recipe.imageFullUrl!,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: 150,
                        color: Colors.grey[300],
                        child: const Center(
                          child: Icon(
                            Icons.restaurant,
                            size: 64,
                            color: Colors.grey,
                          ),
                        ),
                      );
                    },
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        height: 150,
                        color: Colors.grey[200],
                        child: Center(
                          child: CircularProgressIndicator(
                            value:
                                loadingProgress.expectedTotalBytes != null
                                    ? loadingProgress.cumulativeBytesLoaded /
                                        loadingProgress.expectedTotalBytes!
                                    : null,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              )
            else
              // Placeholder if no image
              Container(
                height: 150,
                width: double.infinity,
                color: Colors.grey[300],
                child: const Center(
                  child: Icon(Icons.restaurant, size: 64, color: Colors.grey),
                ),
              ),

            // Recipe Info
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recipe.name,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.restaurant_menu,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        // recipe.mealType,
                        // Localize meal type using helper to keep backend identifiers mapping
                        localizeMealType(recipe.mealType, context),
                        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      ),
                      const SizedBox(width: 16),
                      Icon(
                        Icons.access_time,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        // '${recipe.totalTime} mins',
                        '${recipe.totalTime} ${AppLocalizations.of(context)!.minutesAbbr}',
                        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                  if (recipe.costPerServing != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.attach_money,
                          size: 16,
                          color: Colors.grey[600],
                        ),
                        Text(
                          // '${Provider.of<CurrencyProvider>(context, listen: false).symbol}${recipe.costPerServing!.toStringAsFixed(2)} per serving',
                          '${Provider.of<CurrencyProvider>(context, listen: false).symbol}${recipe.costPerServing!.toStringAsFixed(2)} ${AppLocalizations.of(context)!.costPerServingSuffix}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/recipe.dart';
import '../providers/currency_provider.dart';
import '../screens/recipe_detail_screen.dart';
import '../services/profile_service.dart';
import '../l10n/app_localizations.dart';
import '../utils/meal_type_localization.dart';
import 'badge_widget.dart';

class RecipeCard extends StatefulWidget {
  final Recipe recipe;
  final VoidCallback? onRefresh;

  const RecipeCard({Key? key, required this.recipe, this.onRefresh})
    : super(key: key);

  @override
  State<RecipeCard> createState() => _RecipeCardState();
}

class _RecipeCardState extends State<RecipeCard> {
  final ProfileService _profileService = ProfileService();
  String? _creatorBadge;

  @override
  void initState() {
    super.initState();
    _loadCreatorBadge();
  }

  Future<void> _loadCreatorBadge() async {
    try {
      final badgeData = await _profileService.getRecipeCountBadge(
        widget.recipe.creatorId,
      );
      if (mounted) {
        setState(() {
          // badgeData['badge'] is already normalized by ProfileService
          _creatorBadge = badgeData?['badge'];
        });
      }
    } catch (e) {
      // Silent fail - badge is optional
    }
  }

  @override
  Widget build(BuildContext context) {
    final recipe = widget.recipe;
    final onRefresh = widget.onRefresh;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      clipBehavior: Clip.antiAlias,
      elevation: 2,
      child: InkWell(
        onTap: () async {
          // Navigate to RecipeDetailScreen
          await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => RecipeDetailScreen(recipeId: recipe.id),
            ),
          );
          // Refresh the list when returning from detail screen
          onRefresh?.call();
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
                  if (_creatorBadge != null) ...[
                    const SizedBox(height: 6),
                    BadgeWidget(
                      badge: _creatorBadge!,
                      fontSize: 10,
                      iconSize: 12,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                    ),
                  ],
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
                  // Rating display
                  if (recipe.tasteRating != null ||
                      recipe.difficultyRating != null ||
                      recipe.healthRating != null) ...[
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 12,
                      runSpacing: 4,
                      children: [
                        if (recipe.tasteRating != null)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.star,
                                size: 14,
                                color: Colors.amber[700],
                              ),
                              const SizedBox(width: 2),
                              Text(
                                recipe.tasteRating!.toStringAsFixed(1),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[700],
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '(${recipe.tasteRatingCount})',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        if (recipe.difficultyRating != null)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.trending_up,
                                size: 14,
                                color: Colors.orange[700],
                              ),
                              const SizedBox(width: 2),
                              Text(
                                recipe.difficultyRating!.toStringAsFixed(1),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[700],
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '(${recipe.difficultyRatingCount})',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        if (recipe.healthRating != null)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.favorite,
                                size: 14,
                                color: Colors.green[700],
                              ),
                              const SizedBox(width: 2),
                              Text(
                                recipe.healthRating!.toStringAsFixed(1),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[700],
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '(${recipe.healthRatingCount})',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
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

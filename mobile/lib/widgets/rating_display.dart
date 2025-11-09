import 'package:flutter/material.dart';
import '../models/recipe.dart';
import '../models/recipe_rating.dart';
import '../theme/app_theme.dart';
import 'rating_dialog.dart';

class RatingDisplay extends StatelessWidget {
  final Recipe recipe;
  final RecipeRating? userRating;
  final VoidCallback? onRatingChanged;

  const RatingDisplay({
    Key? key,
    required this.recipe,
    this.userRating,
    this.onRatingChanged,
  }) : super(key: key);

  void _showRatingDialog(BuildContext context) {
    showDialog(
      context: context,
      builder:
          (context) => RatingDialog(
            recipeId: recipe.id,
            existingRating: userRating,
            onRatingSubmitted: onRatingChanged,
          ),
    );
  }

  Widget _buildStarRating(double? rating, Color color, {bool small = false}) {
    final displayRating = rating ?? 0.0;
    final starSize = small ? 16.0 : 20.0;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final starValue = index + 1;
        final isFilled = displayRating >= starValue;
        final isPartiallyFilled =
            displayRating > index && displayRating < starValue;

        return Icon(
          isPartiallyFilled
              ? Icons.star_half
              : (isFilled ? Icons.star : Icons.star_border),
          color: color,
          size: starSize,
        );
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with title and rate button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Ratings',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                OutlinedButton.icon(
                  onPressed: () => _showRatingDialog(context),
                  icon: Icon(
                    userRating != null ? Icons.edit : Icons.star_outline,
                    size: 18,
                  ),
                  label: Text(
                    userRating != null ? 'Edit Rating' : 'Rate Recipe',
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primaryGreen,
                    side: BorderSide(color: AppTheme.primaryGreen),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Taste Rating
            _buildRatingRow(
              label: 'Taste',
              rating: recipe.tasteRating,
              count: recipe.tasteRatingCount,
              color: AppTheme.primaryGreen,
              userRating: userRating?.tasteRating,
            ),
            const SizedBox(height: 12),

            // Difficulty Rating
            _buildRatingRow(
              label: 'Difficulty',
              rating: recipe.difficultyRating,
              count: recipe.difficultyRatingCount,
              color: Colors.orange.shade700,
              userRating: userRating?.difficultyRating,
            ),

            // Health Rating (if available)
            if (recipe.healthRating != null ||
                recipe.healthRatingCount > 0) ...[
              const SizedBox(height: 12),
              _buildRatingRow(
                label: 'Health',
                rating: recipe.healthRating,
                count: recipe.healthRatingCount,
                color: Colors.green.shade700,
                userRating: null, // Health ratings are separate, not shown here
              ),
            ],

            // User's rating section (if exists)
            if (userRating != null) ...[
              const Divider(height: 24),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppTheme.primaryGreen.withOpacity(0.3),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.person,
                          size: 16,
                          color: AppTheme.primaryGreen,
                        ),
                        const SizedBox(width: 4),
                        const Text(
                          'Your Rating',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (userRating!.tasteRating != null)
                      Row(
                        children: [
                          const SizedBox(width: 20),
                          const Text('Taste: ', style: TextStyle(fontSize: 13)),
                          _buildStarRating(
                            userRating!.tasteRating,
                            AppTheme.primaryGreen,
                            small: true,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            userRating!.tasteRating!.toStringAsFixed(1),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    if (userRating!.difficultyRating != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Row(
                          children: [
                            const SizedBox(width: 20),
                            const Text(
                              'Difficulty: ',
                              style: TextStyle(fontSize: 13),
                            ),
                            _buildStarRating(
                              userRating!.difficultyRating,
                              Colors.orange.shade700,
                              small: true,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              userRating!.difficultyRating!.toStringAsFixed(1),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRatingRow({
    required String label,
    required double? rating,
    required int count,
    required Color color,
    double? userRating,
  }) {
    return Row(
      children: [
        // Label
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          ),
        ),

        // Stars
        _buildStarRating(rating, color),

        const SizedBox(width: 8),

        // Rating value
        Text(
          rating != null ? rating.toStringAsFixed(1) : 'N/A',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),

        const SizedBox(width: 4),

        // Rating count
        Text(
          '($count)',
          style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
        ),
      ],
    );
  }
}

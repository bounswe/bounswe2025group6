import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/recipe.dart';
import '../providers/currency_provider.dart';
import '../screens/recipe_detail_screen.dart';
import '../screens/other_user_profile_screen.dart';
import '../services/profile_service.dart';
import '../services/storage_service.dart';
import '../l10n/app_localizations.dart';
import '../utils/meal_type_localization.dart';
import 'badge_widget.dart';

class RecipeCard extends StatefulWidget {
  final Recipe recipe;
  final String? creatorUsername;
  final VoidCallback? onRefresh;

  const RecipeCard({Key? key, required this.recipe, this.creatorUsername, this.onRefresh})
    : super(key: key);

  @override
  State<RecipeCard> createState() => _RecipeCardState();
}

class _RecipeCardState extends State<RecipeCard> {
  final ProfileService _profileService = ProfileService();
  String? _creatorBadge;
  String? _fetchedUsername;
  bool _isLoadingUsername = false;
  bool _hasFetched = false;

  @override
  void initState() {
    super.initState();
    _loadCreatorBadge();
    _fetchUsernameIfNeeded();
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
  void didUpdateWidget(RecipeCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.recipe.creatorId != widget.recipe.creatorId) {
      _hasFetched = false;
      _fetchUsernameIfNeeded();
    }
  }

  Future<void> _fetchUsernameIfNeeded() async {
    if (_hasFetched || widget.creatorUsername != null || _isLoadingUsername) {
      return;
    }
    
    _hasFetched = true;
    setState(() {
      _isLoadingUsername = true;
    });

    try {
      final profileService = ProfileService();
      final profile = await profileService.getUserProfileById(widget.recipe.creatorId);
      if (mounted) {
        setState(() {
          _fetchedUsername = profile.username;
          _isLoadingUsername = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingUsername = false;
        });
      }
    }
  }

  String? get displayUsername => widget.creatorUsername ?? _fetchedUsername;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      clipBehavior: Clip.antiAlias,
      elevation: 3,
      shadowColor: Colors.black26,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) =>
                  RecipeDetailScreen(recipeId: widget.recipe.id),
            ),
          );
          widget.onRefresh?.call();
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Recipe Image with gradient overlay
            Stack(
              children: [
                if (widget.recipe.imageFullUrl != null &&
                    widget.recipe.imageFullUrl!.isNotEmpty)
                  ConstrainedBox(
                    constraints: const BoxConstraints(
                      maxHeight: 200,
                      minHeight: 180,
                    ),
                    child: Container(
                      width: double.infinity,
                      color: Colors.grey[100],
                      child: Image.network(
                        widget.recipe.imageFullUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return _buildPlaceholder();
                        },
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Container(
                            height: 180,
                            color: Colors.grey[200],
                            child: Center(
                              child: CircularProgressIndicator(
                                value:
                                    loadingProgress.expectedTotalBytes != null
                                        ? loadingProgress
                                                .cumulativeBytesLoaded /
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
                  _buildPlaceholder(),

                // Gradient overlay at bottom
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    height: 60,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        colors: [
                          Colors.black.withOpacity(0.7),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),

                // Meal type badge
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _getMealTypeColor(widget.recipe.mealType),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      localizeMealType(widget.recipe.mealType, context),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),

                // Time badge
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.access_time,
                          size: 14,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${widget.recipe.totalTime} ${AppLocalizations.of(context)!.minutesAbbr}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // Recipe Info
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.recipe.name,
                    style: const TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.5,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),

                  // Info chips row
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      // Nutrition chip
                      if (widget.recipe.recipeNutritions != null &&
                          widget.recipe.recipeNutritions!['calories'] != null)
                        _buildInfoChip(
                          icon: Icons.local_fire_department,
                          label:
                              '${_parseCalories(widget.recipe.recipeNutritions!['calories'])} kcal',
                          color: Colors.orange,
                        ),

                      // Cost chip
                      if (widget.recipe.costPerServing != null)
                        _buildInfoChip(
                          icon: Icons.payments_outlined,
                          label:
                              '${Provider.of<CurrencyProvider>(context, listen: false).symbol}${widget.recipe.costPerServing!.toStringAsFixed(2)}',
                          color: Colors.green,
                        ),
                    ],
                  ),

                  // Ratings row
                  if (widget.recipe.tasteRating != null ||
                      widget.recipe.difficultyRating != null ||
                      widget.recipe.healthRating != null) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        if (widget.recipe.tasteRating != null) ...[
                          _buildRatingBadge(
                            icon: Icons.star_rounded,
                            rating: widget.recipe.tasteRating!,
                            count: widget.recipe.tasteRatingCount,
                            color: Colors.amber,
                          ),
                          const SizedBox(width: 12),
                        ],
                        if (widget.recipe.difficultyRating != null) ...[
                          _buildRatingBadge(
                            icon: Icons.speed_rounded,
                            rating: widget.recipe.difficultyRating!,
                            count: widget.recipe.difficultyRatingCount,
                            color: Colors.deepOrange,
                          ),
                          const SizedBox(width: 12),
                        ],
                        if (widget.recipe.healthRating != null)
                          _buildRatingBadge(
                            icon: Icons.favorite_rounded,
                            rating: widget.recipe.healthRating!,
                            count: widget.recipe.healthRatingCount,
                            color: Colors.green,
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

  Widget _buildPlaceholder() {
    return Container(
      height: 180,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.grey[300]!, Colors.grey[400]!],
        ),
      ),
      child: const Center(
        child: Icon(Icons.restaurant_rounded, size: 72, color: Colors.white70),
      ),
    );
  }

  Widget _buildInfoChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: _getDarkerColor(color),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingBadge({
    required IconData icon,
    required double rating,
    required int count,
    required Color color,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 4),
        Text(
          rating.toStringAsFixed(1),
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(width: 2),
        Text(
          '($count)',
          style: TextStyle(fontSize: 12, color: Colors.grey[500]),
        ),
      ],
    );
  }

  Color _getMealTypeColor(String mealType) {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return Colors.orange.shade600;
      case 'lunch':
        return Colors.blue.shade600;
      case 'dinner':
        return Colors.purple.shade600;
      case 'snack':
        return Colors.teal.shade600;
      case 'dessert':
        return Colors.pink.shade600;
      default:
        return Colors.grey.shade600;
    }
  }

  Color _getDarkerColor(Color color) {
    // Create a darker version of the color for better contrast
    final hsl = HSLColor.fromColor(color);
    return hsl.withLightness((hsl.lightness - 0.2).clamp(0.0, 1.0)).toColor();
  }

  String _parseCalories(dynamic value) {
    if (value == null) return '0';
    if (value is num) {
      return value.toStringAsFixed(0);
    }
    final parsed = double.tryParse(value.toString());
    return parsed?.toStringAsFixed(0) ?? '0';
  }
}

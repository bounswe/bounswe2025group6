import 'package:flutter/material.dart';
import '../models/recipe.dart';
import '../services/recipe_service.dart';
import '../theme/app_theme.dart';

class RecipeDetailScreen extends StatefulWidget {
  final int recipeId;

  const RecipeDetailScreen({Key? key, required this.recipeId})
    : super(key: key);

  @override
  _RecipeDetailScreenState createState() => _RecipeDetailScreenState();
}

class _RecipeDetailScreenState extends State<RecipeDetailScreen> {
  final RecipeService _recipeService = RecipeService();
  late Future<Recipe> _recipeFuture;

  @override
  void initState() {
    super.initState();
    _recipeFuture = _recipeService.getRecipeDetails(widget.recipeId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recipe Details'),
        backgroundColor: AppTheme.primaryGreen,
      ),
      body: FutureBuilder<Recipe>(
        future: _recipeFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            final recipe = snapshot.data!;
            return Container(
              color: AppTheme.backgroundGrey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    // Recipe Name
                    Center(
                      child: Text(
                        recipe.name,
                        style: Theme.of(
                          context,
                        ).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryGreen,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Quick Info Section
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: <Widget>[
                            _buildInfoColumn(
                              Icons.timer_outlined,
                              '${recipe.prepTime} min',
                              'Prep Time',
                              context,
                            ),
                            _buildInfoColumn(
                              Icons.whatshot_outlined,
                              '${recipe.cookTime} min',
                              'Cook Time',
                              context,
                            ),
                            _buildInfoColumn(
                              Icons.restaurant_menu_outlined,
                              recipe.mealType,
                              'Meal Type',
                              context,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Ingredients Section
                    _buildSectionTitle(
                      'Ingredients',
                      Icons.kitchen_outlined,
                      context,
                    ),
                    const SizedBox(height: 8),
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child:
                            recipe.ingredients.isEmpty
                                ? const Text(
                                  'No ingredients listed.',
                                  style: TextStyle(fontStyle: FontStyle.italic),
                                )
                                : Column(
                                  children:
                                      recipe.ingredients.map((item) {
                                        return Padding(
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 4.0,
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(
                                                Icons.check_circle_outline,
                                                color: AppTheme.primaryGreen,
                                                size: 20,
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  '${item.ingredient.name} (${item.quantity} ${item.unit})',
                                                  style:
                                                      Theme.of(
                                                        context,
                                                      ).textTheme.bodyLarge,
                                                ),
                                              ),
                                            ],
                                          ),
                                        );
                                      }).toList(),
                                ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Steps Section
                    _buildSectionTitle(
                      'Preparation Steps',
                      Icons.format_list_numbered_outlined,
                      context,
                    ),
                    const SizedBox(height: 8),
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child:
                            recipe.steps.isEmpty
                                ? const Text(
                                  'No steps provided.',
                                  style: TextStyle(fontStyle: FontStyle.italic),
                                )
                                : Column(
                                  children:
                                      recipe.steps.asMap().entries.map((entry) {
                                        int idx = entry.key;
                                        String step = entry.value;
                                        return Padding(
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 8.0,
                                          ),
                                          child: Row(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              CircleAvatar(
                                                backgroundColor:
                                                    AppTheme.primaryGreen,
                                                radius: 12,
                                                child: Text(
                                                  '${idx + 1}',
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 12),
                                              Expanded(
                                                child: Text(
                                                  step,
                                                  style:
                                                      Theme.of(
                                                        context,
                                                      ).textTheme.bodyLarge,
                                                ),
                                              ),
                                            ],
                                          ),
                                        );
                                      }).toList(),
                                ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Additional Details Section
                    _buildSectionTitle(
                      'Additional Information',
                      Icons.info_outline,
                      context,
                    ),
                    const SizedBox(height: 8),
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children:
                              [
                                    if (recipe.costPerServing != null)
                                      _buildDetailRow(
                                        Icons.attach_money_outlined,
                                        'Cost per Serving:',
                                        '\$${recipe.costPerServing?.toStringAsFixed(2)}',
                                        context,
                                      ),
                                    if (recipe.difficultyRating != null)
                                      _buildDetailRow(
                                        Icons.star_border_outlined,
                                        'Difficulty:',
                                        '${recipe.difficultyRating}/5',
                                        context,
                                      ),
                                    if (recipe.tasteRating != null)
                                      _buildDetailRow(
                                        Icons.thumb_up_alt_outlined,
                                        'Taste Rating:',
                                        '${recipe.tasteRating}/5',
                                        context,
                                      ),
                                    if (recipe.healthRating != null)
                                      _buildDetailRow(
                                        Icons.health_and_safety_outlined,
                                        'Health Rating:',
                                        '${recipe.healthRating}/5',
                                        context,
                                      ),
                                    _buildDetailRow(
                                      Icons.favorite_border_outlined,
                                      'Likes:',
                                      '${recipe.likeCount}',
                                      context,
                                    ),
                                    _buildDetailRow(
                                      Icons.comment_outlined,
                                      'Comments:',
                                      '${recipe.commentCount}',
                                      context,
                                    ),
                                    if (recipe.allergens.isNotEmpty)
                                      _buildDetailRow(
                                        Icons.warning_amber_outlined,
                                        'Allergens:',
                                        recipe.allergens.join(", "),
                                        context,
                                      ),
                                    if (recipe.dietaryInfo.isNotEmpty)
                                      _buildDetailRow(
                                        Icons.restaurant_outlined,
                                        'Dietary Info:',
                                        recipe.dietaryInfo.join(", "),
                                        context,
                                      ),
                                  ]
                                  .where((widget) => widget != null)
                                  .cast<Widget>()
                                  .toList(),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            );
          } else {
            return const Center(child: Text('Recipe not found.'));
          }
        },
      ),
    );
  }

  Widget _buildInfoColumn(
    IconData icon,
    String value,
    String label,
    BuildContext context,
  ) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Icon(icon, color: AppTheme.primaryGreen, size: 28),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: Colors.grey[700]),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title, IconData icon, BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.primaryGreen, size: 24),
        const SizedBox(width: 8),
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
            color: AppTheme.primaryGreen,
          ),
        ),
      ],
    );
  }

  Widget? _buildDetailRow(
    IconData icon,
    String label,
    String value,
    BuildContext context,
  ) {
    if (value.isEmpty ||
        value == 'null' ||
        (value.contains('/') && value.startsWith('null'))) {
      return null;
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(icon, color: AppTheme.primaryGreen, size: 20),
          const SizedBox(width: 10),
          Text(
            '$label ',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: Colors.black54),
            ),
          ),
        ],
      ),
    );
  }
}

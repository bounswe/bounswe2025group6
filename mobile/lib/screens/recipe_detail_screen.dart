import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/recipe.dart';
import '../models/report.dart';
import '../services/recipe_service.dart';
import '../theme/app_theme.dart';
import '../widgets/report_button.dart';
import '../l10n/app_localizations.dart';
import '../utils/ingredient_translator.dart';
import '../providers/currency_provider.dart';

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
  Recipe? _currentRecipe; // Store the loaded recipe for report button

  @override
  void initState() {
    super.initState();
    _recipeFuture = _recipeService.getRecipeDetails(widget.recipeId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.recipeDetailsTitle),
        backgroundColor: AppTheme.primaryGreen,
        actions: [
          if (_currentRecipe != null)
            ReportButton(
              contentType: ReportContentType.recipe,
              objectId: widget.recipeId,
              contentPreview: _currentRecipe!.name,
            ),
        ],
      ),
      body: FutureBuilder<Recipe>(
        future: _recipeFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(
              child: Text(
                AppLocalizations.of(
                  context,
                )!.errorLoadingRecipes(snapshot.error.toString()),
              ),
            );
          } else if (snapshot.hasData) {
            final recipe = snapshot.data!;
            // Store recipe for report button (only update if changed)
            if (_currentRecipe == null || _currentRecipe!.id != recipe.id) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) {
                  setState(() {
                    _currentRecipe = recipe;
                  });
                }
              });
            }
            return Container(
              color: AppTheme.backgroundGrey,
              child: SingleChildScrollView(
                padding: EdgeInsets.zero, // Remove padding for full-width image
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    // Recipe Image Banner
                    if (recipe.imageFullUrl != null &&
                        recipe.imageFullUrl!.isNotEmpty)
                      Hero(
                        tag: 'recipe_image_${recipe.id}',
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(
                            maxHeight: 350,
                            minHeight: 200,
                          ),
                          child: Container(
                            width: double.infinity,
                            color: Colors.grey[900],
                            child: Stack(
                              fit: StackFit.passthrough,
                              children: [
                                Image.network(
                                  recipe.imageFullUrl!,
                                  width: double.infinity,
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Container(
                                      height: 200,
                                      color: Colors.grey[300],
                                      child: const Icon(
                                        Icons.restaurant,
                                        size: 80,
                                        color: Colors.grey,
                                      ),
                                    );
                                  },
                                ),
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                      colors: [
                                        Colors.transparent,
                                        Colors.black.withOpacity(0.3),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                    else
                      Container(
                        width: double.infinity,
                        height: 200,
                        color: Colors.grey[300],
                        child: const Icon(
                          Icons.restaurant,
                          size: 80,
                          color: Colors.grey,
                        ),
                      ),

                    // Content with padding
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
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
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceAround,
                                children: <Widget>[
                                  _buildInfoColumn(
                                    Icons.timer_outlined,
                                    '${recipe.prepTime} ${AppLocalizations.of(context)!.minutesAbbr}',
                                    AppLocalizations.of(context)!.prepTimeLabel,
                                    context,
                                  ),
                                  _buildInfoColumn(
                                    Icons.whatshot_outlined,
                                    '${recipe.cookTime} ${AppLocalizations.of(context)!.minutesAbbr}',
                                    AppLocalizations.of(context)!.cookTimeLabel,
                                    context,
                                  ),
                                  _buildInfoColumn(
                                    Icons.restaurant_menu_outlined,
                                    recipe.mealType == 'breakfast'
                                        ? AppLocalizations.of(
                                          context,
                                        )!.breakfast
                                        : recipe.mealType == 'lunch'
                                        ? AppLocalizations.of(context)!.lunch
                                        : AppLocalizations.of(context)!.dinner,
                                    AppLocalizations.of(context)!.mealTypeLabel,
                                    context,
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                    // Ingredients Section
                    _buildSectionTitle(
                      AppLocalizations.of(context)!.ingredientsTitle,
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
                                ? Text(
                                  AppLocalizations.of(context)!.noIngredients,
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
                                                  '${translateIngredient(context, item.ingredient.name)} (${item.quantity} ${item.unit})',
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
                      AppLocalizations.of(context)!.preparationStepsTitle,
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
                                ? Text(
                                  AppLocalizations.of(context)!.noStepsProvided,
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
                      AppLocalizations.of(context)!.additionalInformationTitle,
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
                                        // 'Cost per Serving:',
                                        AppLocalizations.of(
                                          context,
                                        )!.costPerServingLabel,
                                        '${Provider.of<CurrencyProvider>(context, listen: false).symbol}${recipe.costPerServing?.toStringAsFixed(2)}',
                                        context,
                                      ),
                                    if (recipe.difficultyRating != null)
                                      _buildDetailRow(
                                        Icons.star_border_outlined,
                                        // 'Difficulty:',
                                        AppLocalizations.of(
                                          context,
                                        )!.difficultyLabel,
                                        '${recipe.difficultyRating}/5',
                                        context,
                                      ),
                                    if (recipe.tasteRating != null)
                                      _buildDetailRow(
                                        Icons.thumb_up_alt_outlined,
                                        // 'Taste Rating:',
                                        AppLocalizations.of(
                                          context,
                                        )!.tasteRatingLabel,
                                        '${recipe.tasteRating}/5',
                                        context,
                                      ),
                                    if (recipe.healthRating != null)
                                      _buildDetailRow(
                                        Icons.health_and_safety_outlined,
                                        // 'Health Rating:',
                                        AppLocalizations.of(
                                          context,
                                        )!.healthRatingLabel,
                                        '${recipe.healthRating}/5',
                                        context,
                                      ),
                                    _buildDetailRow(
                                      Icons.favorite_border_outlined,
                                      // 'Likes:',
                                      AppLocalizations.of(context)!.likesLabel,
                                      '${recipe.likeCount}',
                                      context,
                                    ),
                                    _buildDetailRow(
                                      Icons.comment_outlined,
                                      // 'Comments:',
                                      AppLocalizations.of(
                                        context,
                                      )!.commentsLabel,
                                      '${recipe.commentCount}',
                                      context,
                                    ),
                                    if (recipe.allergens.isNotEmpty)
                                      _buildDetailRow(
                                        Icons.warning_amber_outlined,
                                        // 'Allergens:',
                                        AppLocalizations.of(
                                          context,
                                        )!.allergensLabel,
                                        recipe.allergens.join(", "),
                                        context,
                                      ),
                                    if (recipe.dietaryInfo.isNotEmpty)
                                      _buildDetailRow(
                                        Icons.restaurant_outlined,
                                        // 'Dietary Info:',
                                        AppLocalizations.of(
                                          context,
                                        )!.dietaryInfoLabel,
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
            return Center(
              child: Text(AppLocalizations.of(context)!.recipeNotFound),
            );
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

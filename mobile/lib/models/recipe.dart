import 'ingredient.dart';

class Recipe {
  final int id;
  final String name;
  final List<String> steps;
  final int prepTime;
  final int cookTime;
  final String mealType;
  final int creatorId;
  final String? creatorUsername;
  final List<IngredientQuantity>
  ingredients; // Using a wrapper for ingredient + quantity
  final double? costPerServing;
  final double? difficultyRating;
  final double? tasteRating;
  final double? healthRating;
  final int likeCount;
  final int commentCount;
  final int difficultyRatingCount;
  final int tasteRatingCount;
  final int healthRatingCount;
  final bool isApproved;
  final bool isFeatured;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedOn;
  final int totalTime;
  final int totalUserRatings; // Assuming this is total_user_ratings
  final int totalRatings; // Assuming this is total_ratings
  final List<String> allergens; // Changed from alergens to allergens
  final List<String> dietaryInfo;
  final String? imageFullUrl; // Image URL from Cloudinary
  final String? imageRelativeUrl; // Relative path
  final Map<String, dynamic>? recipeCosts; // Market prices from backend
  final Map<String, dynamic>? recipeNutritions; // Nutrition info from backend

  Recipe({
    required this.id,
    required this.name,
    required this.steps,
    required this.prepTime,
    required this.cookTime,
    required this.mealType,
    required this.creatorId,
    this.creatorUsername,
    required this.ingredients,
    this.costPerServing,
    this.difficultyRating,
    this.tasteRating,
    this.healthRating,
    required this.likeCount,
    required this.commentCount,
    required this.difficultyRatingCount,
    required this.tasteRatingCount,
    required this.healthRatingCount,
    required this.isApproved,
    required this.isFeatured,
    required this.createdAt,
    required this.updatedAt,
    this.deletedOn,
    required this.totalTime,
    required this.totalUserRatings,
    required this.totalRatings,
    required this.allergens,
    required this.dietaryInfo,
    this.imageFullUrl,
    this.imageRelativeUrl,
    this.recipeCosts,
    this.recipeNutritions,
  });

  factory Recipe.fromJson(Map<String, dynamic> json) {
    var ingredientsList =
        (json['ingredients'] as List<dynamic>? ?? [])
            .map((i) => IngredientQuantity.fromJson(i))
            .toList();

    var stepsList =
        (json['steps'] as List<dynamic>? ?? [])
            .map((s) => s.toString())
            .toList();

    var allergensList =
        (json['alergens'] as List<dynamic>? ??
                []) // Corrected from 'alergens' in API doc
            .map((a) => a.toString())
            .toList();

    var dietaryInfoList =
        (json['dietary_info'] as List<dynamic>? ?? [])
            .map((d) => d.toString())
            .toList();

    return Recipe(
      id: int.tryParse(json['id']?.toString() ?? '') ?? 0,
      name: json['name']?.toString() ?? '',
      steps: stepsList,
      prepTime: int.tryParse(json['prep_time']?.toString() ?? '') ?? 0,
      cookTime: int.tryParse(json['cook_time']?.toString() ?? '') ?? 0,
      mealType: json['meal_type']?.toString() ?? '',
      creatorId: int.tryParse(json['creator_id']?.toString() ?? '') ?? 0,
      creatorUsername: json['creator_username']?.toString(),
      ingredients: ingredientsList,
      costPerServing: double.tryParse(
        json['cost_per_serving']?.toString() ?? '',
      ),
      difficultyRating: double.tryParse(
        json['difficulty_rating']?.toString() ?? '',
      ),
      tasteRating: double.tryParse(json['taste_rating']?.toString() ?? ''),
      healthRating: double.tryParse(json['health_rating']?.toString() ?? ''),
      likeCount: int.tryParse(json['like_count']?.toString() ?? '') ?? 0,
      commentCount: int.tryParse(json['comment_count']?.toString() ?? '') ?? 0,
      difficultyRatingCount:
          int.tryParse(json['difficulty_rating_count']?.toString() ?? '') ?? 0,
      tasteRatingCount:
          int.tryParse(json['taste_rating_count']?.toString() ?? '') ?? 0,
      healthRatingCount:
          int.tryParse(json['health_rating_count']?.toString() ?? '') ?? 0,
      isApproved: _parseBool(json['is_approved']) ?? false,
      isFeatured: _parseBool(json['is_featured']) ?? false,
      createdAt:
          DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(json['updated_at']?.toString() ?? '') ??
          DateTime.now(),
      deletedOn: DateTime.tryParse(
        json['deleted_on']?.toString() ?? '',
      ), // Allows null if parsing fails or string is empty
      totalTime: int.tryParse(json['total_time']?.toString() ?? '') ?? 0,
      totalUserRatings:
          int.tryParse(json['total_user_ratings']?.toString() ?? '') ?? 0,
      totalRatings: int.tryParse(json['total_ratings']?.toString() ?? '') ?? 0,
      allergens: allergensList,
      dietaryInfo: dietaryInfoList,
      imageFullUrl: json['image_full_url']?.toString(),
      imageRelativeUrl: json['image_relative_url']?.toString(),
      recipeCosts:
          json['recipe_costs'] is Map
              ? json['recipe_costs'] as Map<String, dynamic>?
              : null,
      recipeNutritions:
          json['recipe_nutritions'] is Map
              ? json['recipe_nutritions'] as Map<String, dynamic>?
              : null,
    );
  }

  factory Recipe.fromListJson(Map<String, dynamic> json) {
    return Recipe(
      id: int.tryParse(json['id']?.toString() ?? '') ?? 0,
      name: json['name']?.toString() ?? '',
      steps: [], // Not in list view
      prepTime: int.tryParse(json['prep_time']?.toString() ?? '') ?? 0,
      cookTime: int.tryParse(json['cook_time']?.toString() ?? '') ?? 0,
      mealType: json['meal_type']?.toString() ?? '',
      creatorId: int.tryParse(json['creator_id']?.toString() ?? '') ?? 0,
      creatorUsername: json['creator_username']?.toString(),
      ingredients: [], // Not in list view in detail
      costPerServing: double.tryParse(
        json['cost_per_serving']?.toString() ?? '',
      ),
      difficultyRating: double.tryParse(
        json['difficulty_rating']?.toString() ?? '',
      ),
      tasteRating: double.tryParse(json['taste_rating']?.toString() ?? ''),
      healthRating: double.tryParse(json['health_rating']?.toString() ?? ''),
      likeCount: int.tryParse(json['like_count']?.toString() ?? '') ?? 0,
      commentCount: int.tryParse(json['comment_count']?.toString() ?? '') ?? 0,
      difficultyRatingCount:
          int.tryParse(json['difficulty_rating_count']?.toString() ?? '') ?? 0,
      tasteRatingCount:
          int.tryParse(json['taste_rating_count']?.toString() ?? '') ?? 0,
      healthRatingCount:
          int.tryParse(json['health_rating_count']?.toString() ?? '') ?? 0,
      isApproved: _parseBool(json['is_approved']) ?? false,
      isFeatured: _parseBool(json['is_featured']) ?? false,
      createdAt:
          DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(), // Placeholder if not available or parse fails
      updatedAt:
          DateTime.tryParse(json['updated_at']?.toString() ?? '') ??
          DateTime.now(), // Placeholder if not available or parse fails
      deletedOn: null, // Assuming not in list view
      totalTime: int.tryParse(json['total_time']?.toString() ?? '') ?? 0,
      totalUserRatings: 0, // Not in list view example
      totalRatings: 0, // Not in list view example
      allergens: [], // Not in list view example
      dietaryInfo: [], // Not in list view example
      imageFullUrl: json['image_full_url']?.toString(),
      imageRelativeUrl: json['image_relative_url']?.toString(),
      recipeCosts:
          json['recipe_costs'] is Map
              ? json['recipe_costs'] as Map<String, dynamic>?
              : null,
      recipeNutritions:
          json['recipe_nutritions'] is Map
              ? json['recipe_nutritions'] as Map<String, dynamic>?
              : null,
    );
  }
}

// Helper function to parse boolean values that might come as bool, String, or num
bool? _parseBool(dynamic value) {
  if (value == null) return null;
  if (value is bool) return value;
  if (value is String) {
    if (value.toLowerCase() == 'true') return true;
    if (value.toLowerCase() == 'false') return false;
  }
  if (value is num) {
    if (value == 1) return true;
    if (value == 0) return false;
  }
  return null; // Or throw an error, or return a default
}

class IngredientQuantity {
  final IngredientDetail
  ingredient; // This will be the detailed ingredient object
  final double quantity;
  final String unit;

  IngredientQuantity({
    required this.ingredient,
    required this.quantity,
    required this.unit,
  });

  factory IngredientQuantity.fromJson(Map<String, dynamic> json) {
    return IngredientQuantity(
      ingredient: IngredientDetail.fromJson(
        json['ingredient'] as Map<String, dynamic>,
      ),
      quantity: double.tryParse(json['quantity']?.toString() ?? '') ?? 0.0,
      unit: json['unit']?.toString() ?? '',
    );
  }
}

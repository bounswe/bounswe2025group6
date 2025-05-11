import 'ingredient.dart';

class Recipe {
  final int id;
  final String name;
  final List<String> steps;
  final int prepTime;
  final int cookTime;
  final String mealType;
  final int creatorId;
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

  Recipe({
    required this.id,
    required this.name,
    required this.steps,
    required this.prepTime,
    required this.cookTime,
    required this.mealType,
    required this.creatorId,
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
      id: json['id'] as int,
      name: json['name'] as String,
      steps: stepsList,
      prepTime: json['prep_time'] as int,
      cookTime: json['cook_time'] as int,
      mealType: json['meal_type'] as String,
      creatorId: json['creator_id'] as int,
      ingredients: ingredientsList,
      costPerServing: (json['cost_per_serving'] as num?)?.toDouble(),
      difficultyRating: (json['difficulty_rating'] as num?)?.toDouble(),
      tasteRating: (json['taste_rating'] as num?)?.toDouble(),
      healthRating: (json['health_rating'] as num?)?.toDouble(),
      likeCount: json['like_count'] as int? ?? 0,
      commentCount: json['comment_count'] as int? ?? 0,
      difficultyRatingCount: json['difficulty_rating_count'] as int? ?? 0,
      tasteRatingCount: json['taste_rating_count'] as int? ?? 0,
      healthRatingCount: json['health_rating_count'] as int? ?? 0,
      isApproved: json['is_approved'] as bool? ?? false,
      isFeatured: json['is_featured'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      deletedOn:
          json['deleted_on'] == null
              ? null
              : DateTime.parse(json['deleted_on'] as String),
      totalTime: json['total_time'] as int,
      totalUserRatings:
          json['total_user_ratings'] as int? ?? 0, // From API response example
      totalRatings:
          json['total_ratings'] as int? ?? 0, // From API response example
      allergens: allergensList,
      dietaryInfo: dietaryInfoList,
    );
  }

  factory Recipe.fromListJson(Map<String, dynamic> json) {
    return Recipe(
      id: json['id'] as int,
      name: json['name'] as String,
      steps: [], // Not in list view
      prepTime: json['prep_time'] as int,
      cookTime: json['cook_time'] as int,
      mealType: json['meal_type'] as String,
      creatorId: json['creator_id'] as int,
      ingredients: [], // Not in list view in detail
      costPerServing: (json['cost_per_serving'] as num?)?.toDouble(),
      difficultyRating: (json['difficulty_rating'] as num?)?.toDouble(),
      tasteRating: (json['taste_rating'] as num?)?.toDouble(),
      healthRating: (json['health_rating'] as num?)?.toDouble(),
      likeCount: json['like_count'] as int? ?? 0,
      commentCount: json['comment_count'] as int? ?? 0,
      difficultyRatingCount: json['difficulty_rating_count'] as int? ?? 0,
      tasteRatingCount: json['taste_rating_count'] as int? ?? 0,
      healthRatingCount: json['health_rating_count'] as int? ?? 0,
      isApproved: json['is_approved'] as bool? ?? false,
      isFeatured: json['is_featured'] as bool? ?? false,
      createdAt: DateTime.now(), // Placeholder
      updatedAt: DateTime.now(), // Placeholder
      deletedOn: null,
      totalTime: json['total_time'] as int,
      totalUserRatings: 0, // Not in list view example
      totalRatings: 0, // Not in list view example
      allergens: [], // Not in list view example
      dietaryInfo: [], // Not in list view example
    );
  }
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
      quantity: (json['quantity'] as num).toDouble(),
      unit: json['unit'] as String,
    );
  }
}

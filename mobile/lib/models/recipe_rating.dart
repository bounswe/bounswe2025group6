class RecipeRating {
  final int? id;
  final int userId;
  final int recipeId;
  final double? tasteRating;
  final double? difficultyRating;
  final DateTime? createdAt;

  RecipeRating({
    this.id,
    required this.userId,
    required this.recipeId,
    this.tasteRating,
    this.difficultyRating,
    this.createdAt,
  });

  factory RecipeRating.fromJson(Map<String, dynamic> json) {
    return RecipeRating(
      id: json['id'] as int?,
      userId: (json['user'] ?? json['user_id'] ?? 0) as int,
      recipeId: (json['recipe'] ?? json['recipe_id'] ?? 0) as int,
      tasteRating:
          json['taste_rating'] != null
              ? (json['taste_rating'] as num).toDouble()
              : null,
      difficultyRating:
          json['difficulty_rating'] != null
              ? (json['difficulty_rating'] as num).toDouble()
              : null,
      createdAt:
          json['created_at'] != null
              ? DateTime.parse(json['created_at'] as String)
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'user': userId,
      'recipe': recipeId,
      if (tasteRating != null) 'taste_rating': tasteRating,
      if (difficultyRating != null) 'difficulty_rating': difficultyRating,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
    };
  }

  RecipeRating copyWith({
    int? id,
    int? userId,
    int? recipeId,
    double? tasteRating,
    double? difficultyRating,
    DateTime? createdAt,
  }) {
    return RecipeRating(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      recipeId: recipeId ?? this.recipeId,
      tasteRating: tasteRating ?? this.tasteRating,
      difficultyRating: difficultyRating ?? this.difficultyRating,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'RecipeRating(id: $id, userId: $userId, recipeId: $recipeId, tasteRating: $tasteRating, difficultyRating: $difficultyRating, createdAt: $createdAt)';
  }
}

class HealthRating {
  final int? id;
  final int dietitianId;
  final int recipeId;
  final double healthScore;
  final String? comment;
  final DateTime? timestamp;

  HealthRating({
    this.id,
    required this.dietitianId,
    required this.recipeId,
    required this.healthScore,
    this.comment,
    this.timestamp,
  });

  factory HealthRating.fromJson(Map<String, dynamic> json) {
    return HealthRating(
      id: json['id'] as int?,
      dietitianId: json['dietitian'] as int,
      recipeId: json['recipe_id'] as int,
      healthScore: (json['health_score'] as num).toDouble(),
      comment: json['comment'] as String?,
      timestamp:
          json['timestamp'] != null
              ? DateTime.parse(json['timestamp'] as String)
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'recipe_id': recipeId,
      'health_score': healthScore,
    };

    if (id != null) {
      data['id'] = id;
    }
    if (comment != null && comment!.isNotEmpty) {
      data['comment'] = comment;
    }
    if (timestamp != null) {
      data['timestamp'] = timestamp!.toIso8601String();
    }

    return data;
  }

  HealthRating copyWith({
    int? id,
    int? dietitianId,
    int? recipeId,
    double? healthScore,
    String? comment,
    DateTime? timestamp,
  }) {
    return HealthRating(
      id: id ?? this.id,
      dietitianId: dietitianId ?? this.dietitianId,
      recipeId: recipeId ?? this.recipeId,
      healthScore: healthScore ?? this.healthScore,
      comment: comment ?? this.comment,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  @override
  String toString() {
    return 'HealthRating(id: $id, dietitianId: $dietitianId, recipeId: $recipeId, '
        'healthScore: $healthScore, comment: $comment, timestamp: $timestamp)';
  }
}

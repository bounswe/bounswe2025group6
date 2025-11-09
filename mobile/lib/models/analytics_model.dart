class Analytics {
  final int usersCount;
  final int recipesCount;
  final int ingredientsCount;
  final int postsCount;
  final int commentsCount;

  Analytics({
    required this.usersCount,
    required this.recipesCount,
    required this.ingredientsCount,
    required this.postsCount,
    required this.commentsCount,
  });

  factory Analytics.fromJson(Map<String, dynamic> json) {
    return Analytics(
      usersCount: json['users_count'] ?? 0,
      recipesCount: json['recipes_count'] ?? 0,
      ingredientsCount: json['ingredients_count'] ?? 0,
      postsCount: json['posts_count'] ?? 0,
      commentsCount: json['comments_count'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'users_count': usersCount,
      'recipes_count': recipesCount,
      'ingredients_count': ingredientsCount,
      'posts_count': postsCount,
      'comments_count': commentsCount,
    };
  }
}

class UserProfile {
  int? id; // Added user ID
  String username;
  String email;
  String?
  profilePictureUrl; // Nullable if no picture or to store avatar asset path
  List<String> dietaryPreferences;
  List<String> allergens;
  String dislikedFoods;
  double? monthlyBudget; // Nullable
  // int householdSize; // Removed
  bool publicProfile;
  DateTime joinedDate;
  String userType;
  Map<String, dynamic>? notificationPreferences;
  int? recipeCount;
  double? avgRecipeRating;
  String? typeOfCook;
  List<int>? followedUsers;
  List<int>? bookmarkRecipes;
  List<int>? likedRecipes;

  UserProfile({
    this.id, // Added to constructor
    required this.username,
    required this.email,
    this.profilePictureUrl,
    this.dietaryPreferences = const [],
    this.allergens = const [],
    this.dislikedFoods = '',
    this.monthlyBudget,
    // this.householdSize = 1, // Removed
    this.publicProfile = false,
    required this.joinedDate,
    this.userType = 'user',
    this.notificationPreferences,
    this.recipeCount,
    this.avgRecipeRating,
    this.typeOfCook,
    this.followedUsers,
    this.bookmarkRecipes,
    this.likedRecipes,
  });

  // Placeholder factory method
  factory UserProfile.placeholder() {
    return UserProfile(
      id: null, // No ID for placeholder
      username: 'Placeholder User',
      email: 'user@example.com',
      profilePictureUrl: null, // Set to null to avoid network lookup
      dietaryPreferences: ['Vegetarian', 'Gluten-Free'],
      allergens: ['Peanuts'],
      dislikedFoods: 'Mushrooms, Olives',
      monthlyBudget: 500.00,
      // householdSize: 2, // Removed
      publicProfile: true,
      joinedDate: DateTime.now().subtract(Duration(days: 30)),
      userType: 'premium_user',
      notificationPreferences: {
        'email_notifications': true,
        'push_notifications': false,
      },
      recipeCount: 0,
      avgRecipeRating: 0.0,
      typeOfCook: 'beginner',
      followedUsers: [],
      bookmarkRecipes: [],
      likedRecipes: [],
    );
  }

  factory UserProfile.fromJson(Map<String, dynamic> json, int userId) {
    // Helper to safely parse date
    DateTime parseJoinedDate(dynamic dateValue) {
      if (dateValue is String) {
        return DateTime.tryParse(dateValue) ?? DateTime.now();
      }
      // Fallback if date_joined is not a string or not present
      return DateTime.now();
    }

    return UserProfile(
      id: userId,
      username: json['username'] as String? ?? 'N/A',
      email: json['email'] as String? ?? 'N/A',
      profilePictureUrl: json['profilePhoto'] as String?,
      // Fields not supported by backend, retain local or default
      dietaryPreferences:
          (json['dietaryPreferences'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [], // Assuming backend might send it, else default
      allergens:
          (json['foodAllergies'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      dislikedFoods: json['dislikedFoods'] as String? ?? '',
      monthlyBudget: (json['monthlyBudget'] as num?)?.toDouble(),
      // householdSize: json['householdSize'] as int? ?? 1, // Removed
      publicProfile:
          (json['profileVisibility'] as String? ?? 'private') == 'public',
      // Assuming 'date_joined' might be the field from Django's User model
      joinedDate: parseJoinedDate(json['date_joined']),
      userType: json['usertype'] as String? ?? 'user',
      notificationPreferences:
          json['notificationPreferences'] as Map<String, dynamic>?,
      recipeCount: json['recipeCount'] as int?,
      avgRecipeRating: (json['avgRecipeRating'] as num?)?.toDouble(),
      typeOfCook: json['typeOfCook'] as String?,
      followedUsers:
          (json['followedUsers'] as List<dynamic>?)
              ?.map((e) => e as int)
              .toList(),
      bookmarkRecipes:
          (json['bookmarkRecipes'] as List<dynamic>?)
              ?.map((e) => e as int)
              .toList(),
      likedRecipes:
          (json['likedRecipes'] as List<dynamic>?)
              ?.map((e) => e as int)
              .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {};
    // Only include fields supported by the backend for PATCH requests
    if (username.isNotEmpty) data['username'] = username;
    if (email.isNotEmpty) data['email'] = email;
    data['usertype'] = userType; // usertype is likely required or has a default

    // Handle profilePictureUrl: send null if it's an asset path, otherwise send the URL
    if (profilePictureUrl != null && profilePictureUrl!.startsWith('assets/')) {
      data['profilePhoto'] = null;
    } else {
      data['profilePhoto'] = profilePictureUrl;
    }

    data['foodAllergies'] =
        allergens.isNotEmpty ? allergens : []; // Send empty list if none
    data['profileVisibility'] = publicProfile ? 'public' : 'private';

    return data;
  }

  UserProfile copyWith({
    int? id, // Added id
    String? username,
    String? email,
    String? profilePictureUrl,
    List<String>? dietaryPreferences,
    List<String>? allergens,
    String? dislikedFoods,
    double? monthlyBudget,
    bool clearMonthlyBudget = false,
    // int? householdSize, // Removed
    bool? publicProfile,
    DateTime? joinedDate,
    String? userType,
    Map<String, dynamic>? notificationPreferences,
    int? recipeCount,
    double? avgRecipeRating,
    String? typeOfCook,
    List<int>? followedUsers,
    List<int>? bookmarkRecipes,
    List<int>? likedRecipes,
  }) {
    return UserProfile(
      id: id ?? this.id, // Ensure ID is copied
      username: username ?? this.username,
      email: email ?? this.email,
      profilePictureUrl: profilePictureUrl ?? this.profilePictureUrl,
      dietaryPreferences: List<String>.from(
        dietaryPreferences ?? this.dietaryPreferences,
      ),
      allergens: List<String>.from(allergens ?? this.allergens),
      dislikedFoods: dislikedFoods ?? this.dislikedFoods,
      monthlyBudget:
          clearMonthlyBudget ? null : monthlyBudget ?? this.monthlyBudget,
      // householdSize: householdSize ?? this.householdSize, // Removed
      publicProfile: publicProfile ?? this.publicProfile,
      joinedDate: joinedDate ?? this.joinedDate,
      userType: userType ?? this.userType,
      notificationPreferences:
          notificationPreferences ?? this.notificationPreferences,
      recipeCount: recipeCount ?? this.recipeCount,
      avgRecipeRating: avgRecipeRating ?? this.avgRecipeRating,
      typeOfCook: typeOfCook ?? this.typeOfCook,
      followedUsers: followedUsers ?? this.followedUsers,
      bookmarkRecipes: bookmarkRecipes ?? this.bookmarkRecipes,
      likedRecipes: likedRecipes ?? this.likedRecipes,
    );
  }
}

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
  int householdSize;
  bool publicProfile;
  DateTime joinedDate;
  String userType;

  UserProfile({
    this.id, // Added to constructor
    required this.username,
    required this.email,
    this.profilePictureUrl,
    this.dietaryPreferences = const [],
    this.allergens = const [],
    this.dislikedFoods = '',
    this.monthlyBudget,
    this.householdSize = 1,
    this.publicProfile = false,
    required this.joinedDate,
    this.userType = 'user',
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
      householdSize: 2,
      publicProfile: true,
      joinedDate: DateTime.now().subtract(Duration(days: 30)),
      userType: 'premium_user',
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
      householdSize: json['householdSize'] as int? ?? 1,
      publicProfile:
          (json['profileVisibility'] as String? ?? 'private') == 'public',
      // Assuming 'date_joined' might be the field from Django's User model
      joinedDate: parseJoinedDate(json['date_joined']),
      userType: json['usertype'] as String? ?? 'user',
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

    // Fields not sent as they are not supported by backend for update
    // or not part of the core user model in the viewset documentation:
    // 'dietaryPreferences', 'dislikedFoods', 'monthlyBudget', 'householdSize'
    // 'notificationPreferences', 'recipeCount', 'avgRecipeRating', 'typeOfCook'
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
    int? householdSize,
    bool? publicProfile,
    DateTime? joinedDate,
    String? userType,
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
      householdSize: householdSize ?? this.householdSize,
      publicProfile: publicProfile ?? this.publicProfile,
      joinedDate: joinedDate ?? this.joinedDate,
      userType: userType ?? this.userType,
    );
  }
}

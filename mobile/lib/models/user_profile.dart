class UserProfile {
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

  UserProfile copyWith({
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

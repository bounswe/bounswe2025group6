/// Enum for supported languages
enum Language {
  en,
  tr;

  String get displayName {
    switch (this) {
      case Language.en:
        return 'English';
      case Language.tr:
        return 'Türkçe';
    }
  }
}

/// Enum for date formats
enum DateFormat {
  mmddyyyy('MM/DD/YYYY'),
  ddmmyyyy('DD/MM/YYYY'),
  yyyymmdd('YYYY-MM-DD');

  final String value;
  const DateFormat(this.value);

  String get displayName => value;
}

/// Enum for currencies
enum Currency {
  usd('USD'),
  try_('TRY');

  final String value;
  const Currency(this.value);

  String get displayName {
    switch (this) {
      case Currency.usd:
        return 'US Dollar (\$)';
      case Currency.try_:
        return 'Turkish Lira (₺)';
    }
  }
}

/// Enum for accessibility needs
enum AccessibilityNeeds {
  none,
  colorblind,
  visual,
  hearing;

  String get displayName {
    switch (this) {
      case AccessibilityNeeds.none:
        return 'None';
      case AccessibilityNeeds.colorblind:
        return 'Colorblind';
      case AccessibilityNeeds.visual:
        return 'Visual Impairment';
      case AccessibilityNeeds.hearing:
        return 'Hearing Impairment';
    }
  }
}

class UserProfile {
  int? id;
  String username;
  String email;
  String? profilePictureUrl;
  List<String> dietaryPreferences;
  List<String> allergens;
  String dislikedFoods;
  double? monthlyBudget;
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
  
  // New fields
  Language language;
  DateFormat preferredDateFormat;
  DateTime? dateOfBirth;
  String? nationality;
  Currency preferredCurrency;
  AccessibilityNeeds accessibilityNeeds;

  UserProfile({
    this.id,
    required this.username,
    required this.email,
    this.profilePictureUrl,
    this.dietaryPreferences = const [],
    this.allergens = const [],
    this.dislikedFoods = '',
    this.monthlyBudget,
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
    // New fields with defaults
    this.language = Language.en,
    this.preferredDateFormat = DateFormat.yyyymmdd,
    this.dateOfBirth,
    this.nationality,
    this.preferredCurrency = Currency.usd,
    this.accessibilityNeeds = AccessibilityNeeds.none,
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
    DateTime parseDate(dynamic dateValue) {
      if (dateValue is String) {
        return DateTime.tryParse(dateValue) ?? DateTime.now();
      }
      return DateTime.now();
    }

    DateTime? parseDateNullable(dynamic dateValue) {
      if (dateValue is String && dateValue.isNotEmpty) {
        return DateTime.tryParse(dateValue);
      }
      return null;
    }

    Language parseLanguage(dynamic value) {
      final str = value?.toString().toLowerCase();
      return Language.values.firstWhere(
        (lang) => lang.name == str,
        orElse: () => Language.en,
      );
    }

    DateFormat parseDateFormat(dynamic value) {
      final str = value?.toString();
      return DateFormat.values.firstWhere(
        (format) => format.value == str,
        orElse: () => DateFormat.yyyymmdd,
      );
    }

    Currency parseCurrency(dynamic value) {
      final str = value?.toString().toUpperCase();
      return Currency.values.firstWhere(
        (curr) => curr.value == str,
        orElse: () => Currency.usd,
      );
    }

    AccessibilityNeeds parseAccessibility(dynamic value) {
      final str = value?.toString().toLowerCase();
      return AccessibilityNeeds.values.firstWhere(
        (acc) => acc.name == str,
        orElse: () => AccessibilityNeeds.none,
      );
    }

    return UserProfile(
      id: userId,
      username: json['username'] as String? ?? 'N/A',
      email: json['email'] as String? ?? 'N/A',
      profilePictureUrl: json['profilePhoto'] as String?,
      dietaryPreferences:
          (json['dietaryPreferences'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      allergens:
          (json['foodAllergies'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      dislikedFoods: json['dislikedFoods'] as String? ?? '',
      monthlyBudget: (json['monthlyBudget'] as num?)?.toDouble(),
      publicProfile:
          (json['profileVisibility'] as String? ?? 'private') == 'public',
      joinedDate: parseDate(json['date_joined']),
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
      // New fields
      language: parseLanguage(json['language']),
      preferredDateFormat: parseDateFormat(json['preferredDateFormat']),
      dateOfBirth: parseDateNullable(json['date_of_birth']),
      nationality: json['nationality'] as String?,
      preferredCurrency: parseCurrency(json['preferredCurrency']),
      accessibilityNeeds: parseAccessibility(json['accessibilityNeeds']),
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {};
    // Only include fields supported by the backend for PATCH requests
    if (username.isNotEmpty) data['username'] = username;
    if (email.isNotEmpty) data['email'] = email;
    data['usertype'] = userType;

    // Handle profilePictureUrl: send null if it's an asset path, otherwise send the URL
    if (profilePictureUrl != null && profilePictureUrl!.startsWith('assets/')) {
      data['profilePhoto'] = null;
    } else {
      data['profilePhoto'] = profilePictureUrl;
    }

    data['foodAllergies'] = allergens.isNotEmpty ? allergens : [];
    data['profileVisibility'] = publicProfile ? 'public' : 'private';

    if (recipeCount != null) data['recipeCount'] = recipeCount;

    // New fields
    data['language'] = language.name;
    data['preferredDateFormat'] = preferredDateFormat.value;
    if (dateOfBirth != null) {
      data['date_of_birth'] = dateOfBirth!.toIso8601String().split('T')[0]; // YYYY-MM-DD format
    }
    if (nationality != null && nationality!.isNotEmpty) {
      data['nationality'] = nationality;
    }
    data['preferredCurrency'] = preferredCurrency.value;
    data['accessibilityNeeds'] = accessibilityNeeds.name;

    return data;
  }

  UserProfile copyWith({
    int? id,
    String? username,
    String? email,
    String? profilePictureUrl,
    List<String>? dietaryPreferences,
    List<String>? allergens,
    String? dislikedFoods,
    double? monthlyBudget,
    bool clearMonthlyBudget = false,
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
    // New fields
    Language? language,
    DateFormat? preferredDateFormat,
    DateTime? dateOfBirth,
    bool clearDateOfBirth = false,
    String? nationality,
    bool clearNationality = false,
    Currency? preferredCurrency,
    AccessibilityNeeds? accessibilityNeeds,
  }) {
    return UserProfile(
      id: id ?? this.id,
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
      // New fields
      language: language ?? this.language,
      preferredDateFormat: preferredDateFormat ?? this.preferredDateFormat,
      dateOfBirth: clearDateOfBirth ? null : dateOfBirth ?? this.dateOfBirth,
      nationality: clearNationality ? null : nationality ?? this.nationality,
      preferredCurrency: preferredCurrency ?? this.preferredCurrency,
      accessibilityNeeds: accessibilityNeeds ?? this.accessibilityNeeds,
    );
  }
}

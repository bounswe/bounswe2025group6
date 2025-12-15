import 'package:fithub/models/user_profile.dart';
import 'package:fithub/services/profile_service.dart';
import 'package:mocktail/mocktail.dart';

// A mock class for ProfileService using mocktail
class MockProfileService extends Mock implements ProfileService {}

// Helper function to create a sample UserProfile for testing
UserProfile getMockUserProfile({
  String username = 'TestUser',
  String email = 'testuser@example.com',
  String? profilePictureUrl,
  DateTime? joinedDate,
  List<String> dietaryPreferences = const ['Vegetarian'],
  List<String> allergens = const ['Peanuts'],
  String dislikedFoods = 'Onions, Olives',
  double? monthlyBudget = 200.0,
  // int householdSize = 2, // Removed
  bool publicProfile = true,
  String userType = 'Regular',
}) {
  return UserProfile(
    username: username,
    email: email,
    profilePictureUrl: profilePictureUrl,
    joinedDate: joinedDate ?? DateTime(2023, 1, 15),
    dietaryPreferences: List<String>.from(dietaryPreferences),
    allergens: List<String>.from(allergens),
    dislikedFoods: dislikedFoods,
    monthlyBudget: monthlyBudget,
    // householdSize: householdSize, // Removed
    publicProfile: publicProfile,
    userType: userType,
  );
}

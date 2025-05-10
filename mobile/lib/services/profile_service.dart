import 'dart:async';
import '../models/user_profile.dart';

class ProfileService {
  // Simulate a delay for network requests
  static const _simulatedDelay = Duration(milliseconds: 500);

  UserProfile _currentUserProfile = UserProfile.placeholder();

  Future<UserProfile> getUserProfile() async {
    await Future.delayed(_simulatedDelay);
    return _currentUserProfile.copyWith();
  }

  Future<bool> updateUserProfile(UserProfile profileUpdates) async {
    await Future.delayed(_simulatedDelay);
    _currentUserProfile = _currentUserProfile.copyWith(
      username: profileUpdates.username,
      email: profileUpdates.email,
      profilePictureUrl: profileUpdates.profilePictureUrl,
      dietaryPreferences: profileUpdates.dietaryPreferences,
      allergens: profileUpdates.allergens,
      dislikedFoods: profileUpdates.dislikedFoods,
      monthlyBudget: profileUpdates.monthlyBudget,
      clearMonthlyBudget: profileUpdates.monthlyBudget == null,
      householdSize: profileUpdates.householdSize,
      publicProfile: profileUpdates.publicProfile,
      userType: profileUpdates.userType,
    );

    return true; // Simulate success
  }

  Future<bool> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    await Future.delayed(_simulatedDelay);
    // Simulate password change logic
    if (currentPassword == "oldpassword123") {
      // Dummy check
      return true;
    } else {
      return false;
    }
  }

  Future<bool> deleteAccount(String password) async {
    await Future.delayed(Duration(seconds: 1));
    // Simulate account deletion logic
    if (password == "deleteme123") {
      // Dummy check
      _currentUserProfile = UserProfile.placeholder();
      return true;
    } else {
      return false;
    }
  }
}

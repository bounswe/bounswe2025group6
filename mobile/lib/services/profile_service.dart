import 'dart:async';
import 'dart:convert'; // Added for jsonEncode/Decode
import 'package:http/http.dart' as http; // Added for http requests
import '../models/user_profile.dart';
import './storage_service.dart'; // Added for token and user ID

class ProfileServiceException implements Exception {
  final String message;
  final int? statusCode;
  ProfileServiceException(this.message, {this.statusCode});

  @override
  String toString() =>
      'ProfileServiceException: $message (Status: $statusCode)';
}

class ProfileService {
  static const String baseUrl =
      'http://10.0.2.2:8000/api'; // Same as AuthService

  Future<UserProfile> getUserProfile() async {
    final token = await StorageService.getToken();
    final userId = await StorageService.getUserId();

    if (token == null || userId == null) {
      throw ProfileServiceException(
        'User not authenticated. Token or User ID missing.',
        statusCode: 401,
      );
    }

    final response = await http.get(
      Uri.parse('$baseUrl/users/$userId/'),
      headers: {'Authorization': 'Token $token'},
    );

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(response.body);
      return UserProfile.fromJson(responseBody, int.parse(userId));
    } else if (response.statusCode == 401) {
      await StorageService.deleteAllUserData(); // Clear stale auth data
      throw ProfileServiceException(
        'Unauthorized. Please login again.',
        statusCode: response.statusCode,
      );
    } else if (response.statusCode == 404) {
      throw ProfileServiceException(
        'User profile not found.',
        statusCode: response.statusCode,
      );
    } else {
      throw ProfileServiceException(
        'Failed to load profile. Status: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    }
  }

  Future<UserProfile> updateUserProfile(UserProfile profileUpdates) async {
    final token = await StorageService.getToken();
    final userId = await StorageService.getUserId();

    if (token == null || userId == null) {
      throw ProfileServiceException(
        'User not authenticated. Token or User ID missing.',
        statusCode: 401,
      );
    }

    if (profileUpdates.id == null || profileUpdates.id.toString() != userId) {
      throw ProfileServiceException(
        'Profile ID mismatch or missing.',
        statusCode: 400,
      );
    }

    final Map<String, dynamic> requestBody = profileUpdates.toJson();

    final response = await http.patch(
      Uri.parse('$baseUrl/users/$userId/'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token $token',
      },
      body: jsonEncode(requestBody),
    );

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(response.body);
      // Return the updated profile from the server response
      return UserProfile.fromJson(responseBody, int.parse(userId));
    } else if (response.statusCode == 401) {
      await StorageService.deleteAllUserData();
      throw ProfileServiceException(
        'Unauthorized. Please login again.',
        statusCode: response.statusCode,
      );
    } else if (response.statusCode == 400) {
      final errorBody = jsonDecode(response.body);
      throw ProfileServiceException(
        'Failed to update profile: ${errorBody.toString()}',
        statusCode: response.statusCode,
      );
    } else {
      throw ProfileServiceException(
        'Failed to update profile. Status: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    }
  }
}

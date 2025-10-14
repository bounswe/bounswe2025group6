import 'dart:async';
import 'dart:convert'; 
import 'package:http/http.dart' as http; 
import '../models/user_profile.dart';
import './storage_service.dart'; 

class ProfileServiceException implements Exception {
  final String message;
  final int? statusCode;
  ProfileServiceException(this.message, {this.statusCode});

  @override
  String toString() =>
      'ProfileServiceException: $message (Status: $statusCode)';
}

class ProfileService {
  static const String baseUrl = 'http://10.0.2.2:8000';
  String? token;

  ProfileService({this.token});

  Map<String, String> get headers {
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await StorageService.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await http.post(
        Uri.parse('$baseUrl/api/token/refresh/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refresh': refreshToken}),
      );

      if (response.statusCode == 200) {
        final tokenData = jsonDecode(response.body);
        token = tokenData['access'];
        await StorageService.saveJwtAccessToken(token!);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<UserProfile> getUserProfile() async {
    token = await StorageService.getJwtAccessToken();
    final userId = await StorageService.getUserId();

    if (token == null || userId == null) {
      throw ProfileServiceException(
        'User not authenticated. Token or User ID missing.',
        statusCode: 401,
      );
    }

    try {
      var response = await http.get(
        Uri.parse('$baseUrl/api/users/$userId/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) {
          await StorageService.deleteAllUserData();
          throw ProfileServiceException(
            'Authentication failed',
            statusCode: 401,
          );
        }

        response = await http.get(
          Uri.parse('$baseUrl/api/users/$userId/'),
          headers: headers,
        );
      }

      if (response.statusCode == 200) {
        final responseBody = jsonDecode(response.body);
        return UserProfile.fromJson(responseBody, int.parse(userId));
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
    } catch (e) {
      throw ProfileServiceException(e.toString());
    }
  }

  Future<UserProfile> updateUserProfile(UserProfile profileUpdates) async {
    token = await StorageService.getJwtAccessToken();
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

    try {
      var response = await http.patch(
        Uri.parse('$baseUrl/api/users/$userId/'),
        headers: headers,
        body: jsonEncode(requestBody),
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) {
          await StorageService.deleteAllUserData();
          throw ProfileServiceException(
            'Authentication failed',
            statusCode: 401,
          );
        }

        response = await http.patch(
          Uri.parse('$baseUrl/api/users/$userId/'),
          headers: headers,
          body: jsonEncode(requestBody),
        );
      }

      if (response.statusCode == 200) {
        final responseBody = jsonDecode(response.body);
        return UserProfile.fromJson(responseBody, int.parse(userId));
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
    } catch (e) {
      throw ProfileServiceException(e.toString());
    }
  }
}

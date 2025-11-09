import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user_profile.dart';
import '../utils/user_badge_helper.dart';
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
  final Map<int, Map<String, dynamic>> _badgeCache = {};

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

  /// Fetch public profile for arbitrary user id (used to check user type)
  Future<UserProfile> getUserProfileById(int userId) async {
    token = await StorageService.getJwtAccessToken();

    if (token == null) {
      throw ProfileServiceException(
        'User not authenticated. Token missing.',
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
        return UserProfile.fromJson(responseBody, userId);
      } else if (response.statusCode == 404) {
        throw ProfileServiceException(
          'User profile not found.',
          statusCode: 404,
        );
      }

      throw ProfileServiceException(
        'Failed to load profile. Status: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    } catch (e) {
      if (e is ProfileServiceException) rethrow;
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

  Future<Map<String, dynamic>> followUnfollowUser(int targetUserId) async {
    token = await StorageService.getJwtAccessToken();

    if (token == null) {
      throw ProfileServiceException(
        'User not authenticated. Token missing.',
        statusCode: 401,
      );
    }

    try {
      var response = await http.post(
        Uri.parse('$baseUrl/api/users/follow/'),
        headers: headers,
        body: jsonEncode({'user_id': targetUserId}),
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) {
          throw ProfileServiceException(
            'Authentication failed',
            statusCode: 401,
          );
        }

        response = await http.post(
          Uri.parse('$baseUrl/api/users/follow/'),
          headers: headers,
          body: jsonEncode({'user_id': targetUserId}),
        );
      }

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 400) {
        final errorBody = jsonDecode(response.body);
        throw ProfileServiceException(
          errorBody['error'] ?? 'Bad request',
          statusCode: response.statusCode,
        );
      } else if (response.statusCode == 404) {
        throw ProfileServiceException(
          'Target user not found',
          statusCode: response.statusCode,
        );
      } else {
        throw ProfileServiceException(
          'Failed to follow/unfollow user. Status: ${response.statusCode}',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ProfileServiceException) rethrow;
      throw ProfileServiceException(e.toString());
    }
  }

  /// Fetches user's recipe count and badge from API
  /// Returns: {'recipe_count': int?, 'badge': String?}
  Future<Map<String, dynamic>?> getRecipeCountBadge(int userId) async {
    // Check cache first
    if (_badgeCache.containsKey(userId)) {
      return _badgeCache[userId];
    }

    token = await StorageService.getJwtAccessToken();
    if (token == null) {
      return null;
    }

    final url = '$baseUrl/recipes/user/$userId/recipe-count/';

    try {
      var response = await http.get(Uri.parse(url), headers: headers);

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) {
          return null;
        }

        response = await http.get(Uri.parse(url), headers: headers);
      }

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final recipeCount = data['recipe_count'] as int?;
        final apiBadge = data['badge'] as String?;

        // Check user type via profile endpoint to give priority to Dietitian
        String? finalBadge = apiBadge;
        try {
          final profile = await getUserProfileById(userId);
          finalBadge = normalizeBadgeFromApi(
            apiBadge,
            userType: profile.userType,
          );
        } catch (_) {
          // If profile fetch fails, fall back to API badge (no-op)
          finalBadge = normalizeBadgeFromApi(apiBadge);
        }

        final result = {'recipe_count': recipeCount, 'badge': finalBadge};

        // Cache the result
        _badgeCache[userId] = result;
        return result;
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  /// Clear badge cache for specific user
  void clearBadgeCache(int userId) {
    _badgeCache.remove(userId);
  }

  /// Clear all cached badges
  void clearAllBadgeCache() {
    _badgeCache.clear();
  }
}

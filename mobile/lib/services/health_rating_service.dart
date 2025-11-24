import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/health_rating.dart';
import 'storage_service.dart';

class HealthRatingException implements Exception {
  final String message;
  final int? statusCode;

  HealthRatingException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class HealthRatingService {
  static const String baseUrl = 'https://fithubmp.xyz:8000';
  String? token;

  HealthRatingService({this.token});

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

  /// Get health rating for a specific recipe by the current dietitian
  Future<HealthRating?> getHealthRatingForRecipe(int recipeId) async {
    try {
      token ??= await StorageService.getJwtAccessToken();

      final response = await http.get(
        Uri.parse('$baseUrl/api/health-ratings/?recipe_id=$recipeId'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        if (await _refreshToken()) {
          return getHealthRatingForRecipe(recipeId);
        }
        return null;
      }

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        final List<dynamic> ratingsJson =
            responseData is List
                ? responseData
                : (responseData['results'] as List<dynamic>? ?? []);

        if (ratingsJson.isNotEmpty) {
          return HealthRating.fromJson(ratingsJson.first);
        }
        return null;
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  /// Create a new health rating (dietitians only)
  Future<HealthRating> createHealthRating({
    required int recipeId,
    required double healthScore,
    String? comment,
  }) async {
    try {
      if (healthScore < 0.0 || healthScore > 5.0) {
        throw HealthRatingException('Health score must be between 0.0 and 5.0');
      }

      token ??= await StorageService.getJwtAccessToken();

      final Map<String, dynamic> body = {
        'recipe_id': recipeId,
        'health_score': healthScore,
      };
      if (comment != null && comment.isNotEmpty) {
        body['comment'] = comment;
      }

      final response = await http.post(
        Uri.parse('$baseUrl/api/health-ratings/'),
        headers: headers,
        body: jsonEncode(body),
      );

      if (response.statusCode == 401) {
        if (await _refreshToken()) {
          return createHealthRating(
            recipeId: recipeId,
            healthScore: healthScore,
            comment: comment,
          );
        }
        throw HealthRatingException(
          'Authentication failed. Please login again.',
          statusCode: 401,
        );
      }

      if (response.statusCode == 201) {
        final ratingJson = jsonDecode(response.body);
        return HealthRating.fromJson(ratingJson);
      }

      if (response.statusCode == 403) {
        throw HealthRatingException(
          'Only dietitians can give health ratings.',
          statusCode: 403,
        );
      }

      throw HealthRatingException(
        'Failed to create health rating: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    } catch (e) {
      if (e is HealthRatingException) rethrow;
      throw HealthRatingException('Network error: ${e.toString()}');
    }
  }

  /// Update an existing health rating
  Future<HealthRating> updateHealthRating({
    required int ratingId,
    required int recipeId,
    required double healthScore,
    String? comment,
  }) async {
    try {
      if (healthScore < 0.0 || healthScore > 5.0) {
        throw HealthRatingException('Health score must be between 0.0 and 5.0');
      }

      token ??= await StorageService.getJwtAccessToken();

      final Map<String, dynamic> body = {
        'recipe_id': recipeId,
        'health_score': healthScore,
      };
      if (comment != null) {
        body['comment'] = comment;
      }

      final response = await http.patch(
        Uri.parse('$baseUrl/api/health-ratings/$ratingId/'),
        headers: headers,
        body: jsonEncode(body),
      );

      if (response.statusCode == 401) {
        if (await _refreshToken()) {
          return updateHealthRating(
            ratingId: ratingId,
            recipeId: recipeId,
            healthScore: healthScore,
            comment: comment,
          );
        }
        throw HealthRatingException(
          'Authentication failed. Please login again.',
          statusCode: 401,
        );
      }

      if (response.statusCode == 200) {
        final ratingJson = jsonDecode(response.body);
        return HealthRating.fromJson(ratingJson);
      }

      throw HealthRatingException(
        'Failed to update health rating: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    } catch (e) {
      if (e is HealthRatingException) rethrow;
      throw HealthRatingException('Network error: ${e.toString()}');
    }
  }

  /// Delete a health rating
  Future<void> deleteHealthRating(int ratingId) async {
    try {
      token ??= await StorageService.getJwtAccessToken();

      final response = await http.delete(
        Uri.parse('$baseUrl/api/health-ratings/$ratingId/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        if (await _refreshToken()) {
          return deleteHealthRating(ratingId);
        }
        throw HealthRatingException(
          'Authentication failed. Please login again.',
          statusCode: 401,
        );
      }

      if (response.statusCode != 204) {
        throw HealthRatingException(
          'Failed to delete health rating: ${response.statusCode}',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is HealthRatingException) rethrow;
      throw HealthRatingException('Network error: ${e.toString()}');
    }
  }
}

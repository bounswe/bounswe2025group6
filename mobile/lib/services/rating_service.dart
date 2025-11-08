import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/recipe_rating.dart';
import 'storage_service.dart';

class RatingException implements Exception {
  final String message;
  final int? statusCode;

  RatingException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class RatingService {
  static const String baseUrl = 'http://10.0.2.2:8000';
  String? token;

  RatingService({this.token});

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

  /// Get user's rating for a specific recipe
  /// Returns the rating if found, null if not found
  Future<RecipeRating?> getUserRating(int recipeId) async {
    try {
      // Ensure token is loaded
      token ??= await StorageService.getJwtAccessToken();

      final response = await http.get(
        Uri.parse('$baseUrl/api/recipe-ratings/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        // Try to refresh token
        if (await _refreshToken()) {
          return getUserRating(recipeId); // Retry with new token
        }
        throw RatingException(
          'Authentication failed. Please login again.',
          statusCode: 401,
        );
      }

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);

        // Check if response is paginated (has 'results' field)
        final List<dynamic> ratingsJson =
            responseData is List
                ? responseData
                : (responseData['results'] as List<dynamic>? ?? []);

        // Filter ratings by recipe_id
        final userRatings =
            ratingsJson
                .map((json) => RecipeRating.fromJson(json))
                .where((rating) => rating.recipeId == recipeId)
                .toList();

        return userRatings.isNotEmpty ? userRatings.first : null;
      }

      throw RatingException(
        'Failed to get rating: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    } catch (e) {
      if (e is RatingException) rethrow;
      throw RatingException('Network error: ${e.toString()}');
    }
  }

  /// Create a new recipe rating
  /// Both ratings are optional - user can submit with either, both, or none
  Future<RecipeRating> createRating({
    required int recipeId,
    double? tasteRating,
    double? difficultyRating,
  }) async {
    try {
      // Validate rating range if provided
      if (tasteRating != null && (tasteRating < 0.0 || tasteRating > 5.0)) {
        throw RatingException('Taste rating must be between 0.0 and 5.0');
      }
      if (difficultyRating != null &&
          (difficultyRating < 0.0 || difficultyRating > 5.0)) {
        throw RatingException('Difficulty rating must be between 0.0 and 5.0');
      }

      // Ensure token is loaded
      token ??= await StorageService.getJwtAccessToken();

      final Map<String, dynamic> body = {'recipe_id': recipeId};
      if (tasteRating != null) {
        body['taste_rating'] = tasteRating;
      }
      if (difficultyRating != null) {
        body['difficulty_rating'] = difficultyRating;
      }

      final response = await http.post(
        Uri.parse('$baseUrl/api/recipe-ratings/'),
        headers: headers,
        body: jsonEncode(body),
      );

      if (response.statusCode == 401) {
        // Try to refresh token
        if (await _refreshToken()) {
          return createRating(
            recipeId: recipeId,
            tasteRating: tasteRating,
            difficultyRating: difficultyRating,
          );
        }
        throw RatingException(
          'Authentication failed. Please login again.',
          statusCode: 401,
        );
      }

      if (response.statusCode == 201) {
        final ratingJson = jsonDecode(response.body);
        return RecipeRating.fromJson(ratingJson);
      }

      if (response.statusCode == 400) {
        final errorData = jsonDecode(response.body);
        throw RatingException(errorData.toString(), statusCode: 400);
      }

      // Handle duplicate rating error (user already rated this recipe)
      if (response.statusCode == 500) {
        final responseBody = response.body;
        if (responseBody.contains('Duplicate entry') ||
            responseBody.contains('already rated')) {
          // User already rated this recipe, try to get existing rating and update it
          final existingRating = await getUserRating(recipeId);
          if (existingRating != null) {
            return await updateRating(
              ratingId: existingRating.id!,
              recipeId: recipeId,
              tasteRating: tasteRating,
              difficultyRating: difficultyRating,
            );
          }
          throw RatingException(
            'You have already rated this recipe. Please edit your existing rating.',
            statusCode: 409,
          );
        }
      }

      throw RatingException(
        'Failed to create rating: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    } catch (e) {
      if (e is RatingException) rethrow;
      throw RatingException('Network error: ${e.toString()}');
    }
  }

  /// Update an existing recipe rating
  Future<RecipeRating> updateRating({
    required int ratingId,
    required int recipeId,
    double? tasteRating,
    double? difficultyRating,
  }) async {
    try {
      // Validate rating range if provided
      if (tasteRating != null && (tasteRating < 0.0 || tasteRating > 5.0)) {
        throw RatingException('Taste rating must be between 0.0 and 5.0');
      }
      if (difficultyRating != null &&
          (difficultyRating < 0.0 || difficultyRating > 5.0)) {
        throw RatingException('Difficulty rating must be between 0.0 and 5.0');
      }

      // Ensure token is loaded
      token ??= await StorageService.getJwtAccessToken();

      final Map<String, dynamic> body = {'recipe_id': recipeId};
      if (tasteRating != null) {
        body['taste_rating'] = tasteRating;
      }
      if (difficultyRating != null) {
        body['difficulty_rating'] = difficultyRating;
      }

      final response = await http.patch(
        Uri.parse('$baseUrl/api/recipe-ratings/$ratingId/'),
        headers: headers,
        body: jsonEncode(body),
      );

      if (response.statusCode == 401) {
        // Try to refresh token
        if (await _refreshToken()) {
          return updateRating(
            ratingId: ratingId,
            recipeId: recipeId,
            tasteRating: tasteRating,
            difficultyRating: difficultyRating,
          );
        }
        throw RatingException(
          'Authentication failed. Please login again.',
          statusCode: 401,
        );
      }

      if (response.statusCode == 200) {
        final ratingJson = jsonDecode(response.body);
        return RecipeRating.fromJson(ratingJson);
      }

      if (response.statusCode == 400) {
        final errorData = jsonDecode(response.body);
        throw RatingException(errorData.toString(), statusCode: 400);
      }

      if (response.statusCode == 404) {
        throw RatingException('Rating not found', statusCode: 404);
      }

      throw RatingException(
        'Failed to update rating: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    } catch (e) {
      if (e is RatingException) rethrow;
      throw RatingException('Network error: ${e.toString()}');
    }
  }

  /// Delete a recipe rating
  Future<void> deleteRating(int ratingId) async {
    try {
      // Ensure token is loaded
      token ??= await StorageService.getJwtAccessToken();

      final response = await http.delete(
        Uri.parse('$baseUrl/api/recipe-ratings/$ratingId/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        // Try to refresh token
        if (await _refreshToken()) {
          return deleteRating(ratingId); // Retry with new token
        }
        throw RatingException(
          'Authentication failed. Please login again.',
          statusCode: 401,
        );
      }

      if (response.statusCode == 204) {
        return; // Success
      }

      if (response.statusCode == 404) {
        throw RatingException('Rating not found', statusCode: 404);
      }

      throw RatingException(
        'Failed to delete rating: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    } catch (e) {
      if (e is RatingException) rethrow;
      throw RatingException('Network error: ${e.toString()}');
    }
  }

  /// Get all user ratings (for testing/debugging purposes)
  Future<List<RecipeRating>> getAllUserRatings() async {
    try {
      // Ensure token is loaded
      token ??= await StorageService.getJwtAccessToken();

      final response = await http.get(
        Uri.parse('$baseUrl/api/recipe-ratings/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        // Try to refresh token
        if (await _refreshToken()) {
          return getAllUserRatings(); // Retry with new token
        }
        throw RatingException(
          'Authentication failed. Please login again.',
          statusCode: 401,
        );
      }

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);

        // Check if response is paginated (has 'results' field)
        final List<dynamic> ratingsJson =
            responseData is List
                ? responseData
                : (responseData['results'] as List<dynamic>? ?? []);

        return ratingsJson.map((json) => RecipeRating.fromJson(json)).toList();
      }

      throw RatingException(
        'Failed to get ratings: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    } catch (e) {
      if (e is RatingException) rethrow;
      throw RatingException('Network error: ${e.toString()}');
    }
  }
}

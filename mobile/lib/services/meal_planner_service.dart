import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/recipe.dart';
import 'storage_service.dart';

class MealPlannerServiceException implements Exception {
  final String message;
  final int? statusCode;

  MealPlannerServiceException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class MealPlannerService {
  static const String baseUrl = 'http://10.0.2.2:8000';
  String? token;

  MealPlannerService({this.token});

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

  /// Get filtered recipes from meal planner endpoint
  ///
  /// Supports all filters available in the backend:
  /// - name: Recipe name search
  /// - mealType: breakfast, lunch, or dinner
  /// - Cost filters: minCostPerServing, maxCostPerServing
  /// - Rating filters: min/max for difficulty, taste, health ratings
  /// - Like count filters: minLikeCount, maxLikeCount
  /// - Nutrition filters: min/max for calories, carbs, fat, protein
  /// - Time filters: min/max for prepTime, cookTime, totalTime
  /// - Boolean filters: hasImage, isApproved, isFeatured
  /// - Allergen filters: excludeAllergens (list of allergens to exclude)
  /// - Dietary filters: dietInfo (list of dietary preferences)
  /// - Pagination: page, pageSize
  Future<Map<String, dynamic>> getMealPlannerRecipes({
    // Search and classification
    String? name,
    String? mealType, // 'breakfast', 'lunch', 'dinner'
    // Cost filters
    double? minCostPerServing,
    double? maxCostPerServing,

    // Rating filters
    double? minDifficultyRating,
    double? maxDifficultyRating,
    double? minTasteRating,
    double? maxTasteRating,
    double? minHealthRating,
    double? maxHealthRating,
    int? minLikeCount,
    int? maxLikeCount,

    // Nutrition filters
    double? minCalories,
    double? maxCalories,
    double? minCarbs,
    double? maxCarbs,
    double? minFat,
    double? maxFat,
    double? minProtein,
    double? maxProtein,

    // Time filters
    int? minPrepTime,
    int? maxPrepTime,
    int? minCookTime,
    int? maxCookTime,
    int? minTotalTime,
    int? maxTotalTime,

    // Boolean filters
    bool? hasImage,
    bool? isApproved,
    bool? isFeatured,

    // Allergen and dietary filters
    List<String>? excludeAllergens,
    List<String>? dietInfo,

    // Pagination
    int? page,
    int? pageSize,
  }) async {
    token = await StorageService.getJwtAccessToken();
    if (token == null || token!.isEmpty) {
      throw MealPlannerServiceException(
        'Authentication required. Please log in again.',
        statusCode: 401,
      );
    }

    // Build query parameters
    final Map<String, String> queryParams = {};

    if (name != null && name.isNotEmpty) {
      queryParams['name'] = name;
    }
    if (mealType != null && mealType.isNotEmpty) {
      queryParams['meal_type'] = mealType;
    }

    // Cost filters
    if (minCostPerServing != null) {
      queryParams['min_cost_per_serving'] = minCostPerServing.toString();
    }
    if (maxCostPerServing != null) {
      queryParams['max_cost_per_serving'] = maxCostPerServing.toString();
    }

    // Rating filters
    if (minDifficultyRating != null) {
      queryParams['min_difficulty_rating'] = minDifficultyRating.toString();
    }
    if (maxDifficultyRating != null) {
      queryParams['max_difficulty_rating'] = maxDifficultyRating.toString();
    }
    if (minTasteRating != null) {
      queryParams['min_taste_rating'] = minTasteRating.toString();
    }
    if (maxTasteRating != null) {
      queryParams['max_taste_rating'] = maxTasteRating.toString();
    }
    if (minHealthRating != null) {
      queryParams['min_health_rating'] = minHealthRating.toString();
    }
    if (maxHealthRating != null) {
      queryParams['max_health_rating'] = maxHealthRating.toString();
    }
    if (minLikeCount != null) {
      queryParams['min_like_count'] = minLikeCount.toString();
    }
    if (maxLikeCount != null) {
      queryParams['max_like_count'] = maxLikeCount.toString();
    }

    // Nutrition filters
    if (minCalories != null) {
      queryParams['min_calories'] = minCalories.toString();
    }
    if (maxCalories != null) {
      queryParams['max_calories'] = maxCalories.toString();
    }
    if (minCarbs != null) {
      queryParams['min_carbs'] = minCarbs.toString();
    }
    if (maxCarbs != null) {
      queryParams['max_carbs'] = maxCarbs.toString();
    }
    if (minFat != null) {
      queryParams['min_fat'] = minFat.toString();
    }
    if (maxFat != null) {
      queryParams['max_fat'] = maxFat.toString();
    }
    if (minProtein != null) {
      queryParams['min_protein'] = minProtein.toString();
    }
    if (maxProtein != null) {
      queryParams['max_protein'] = maxProtein.toString();
    }

    // Time filters
    if (minPrepTime != null) {
      queryParams['min_prep_time'] = minPrepTime.toString();
    }
    if (maxPrepTime != null) {
      queryParams['max_prep_time'] = maxPrepTime.toString();
    }
    if (minCookTime != null) {
      queryParams['min_cook_time'] = minCookTime.toString();
    }
    if (maxCookTime != null) {
      queryParams['max_cook_time'] = maxCookTime.toString();
    }
    if (minTotalTime != null) {
      queryParams['min_total_time'] = minTotalTime.toString();
    }
    if (maxTotalTime != null) {
      queryParams['max_total_time'] = maxTotalTime.toString();
    }

    // Boolean filters
    if (hasImage != null) {
      queryParams['has_image'] = hasImage.toString();
    }
    if (isApproved != null) {
      queryParams['is_approved'] = isApproved.toString();
    }
    if (isFeatured != null) {
      queryParams['is_featured'] = isFeatured.toString();
    }

    // Allergen and dietary filters
    if (excludeAllergens != null && excludeAllergens.isNotEmpty) {
      // Convert list to comma-separated string
      queryParams['exclude_allergens'] = excludeAllergens.join(',');
    }
    if (dietInfo != null && dietInfo.isNotEmpty) {
      // Convert list to comma-separated string
      queryParams['diet_info'] = dietInfo.join(',');
    }

    // Pagination
    if (page != null) {
      queryParams['page'] = page.toString();
    }
    if (pageSize != null) {
      queryParams['page_size'] = pageSize.toString();
    }

    // Build URL with query parameters
    final uri = Uri.parse(
      '$baseUrl/recipes/meal_planner/',
    ).replace(queryParameters: queryParams);

    try {
      var response = await http.get(uri, headers: headers);

      // Handle token expiration
      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) {
          await StorageService.deleteAllUserData();
          throw MealPlannerServiceException(
            'Authentication failed. Please log in again.',
            statusCode: 401,
          );
        }

        // Retry with refreshed token
        response = await http.get(uri, headers: headers);
      }

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);

        // Parse recipes from results
        final List<dynamic> results =
            responseData['results'] as List<dynamic>? ?? [];

        List<Recipe> recipes =
            results
                .map(
                  (data) => Recipe.fromListJson(data as Map<String, dynamic>),
                )
                .toList();

        // Return paginated response
        return {
          'page': responseData['page'] ?? 1,
          'page_size': responseData['page_size'] ?? 10,
          'total': responseData['total'] ?? 0,
          'recipes': recipes,
        };
      } else if (response.statusCode == 400) {
        final error = jsonDecode(response.body);
        throw MealPlannerServiceException(
          error['error'] ?? 'Invalid request parameters.',
          statusCode: 400,
        );
      } else {
        throw MealPlannerServiceException(
          'Failed to load meal planner recipes. Status: ${response.statusCode}',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is MealPlannerServiceException) {
        rethrow;
      }
      throw MealPlannerServiceException('Network error: ${e.toString()}');
    }
  }

  /// Helper method to get recipes for a specific meal type
  Future<List<Recipe>> getRecipesForMealType(
    String mealType, {
    Map<String, dynamic>? additionalFilters,
  }) async {
    final result = await getMealPlannerRecipes(
      mealType: mealType,
      minCostPerServing: additionalFilters?['minCostPerServing'],
      maxCostPerServing: additionalFilters?['maxCostPerServing'],
      minCalories: additionalFilters?['minCalories'],
      maxCalories: additionalFilters?['maxCalories'],
      minCarbs: additionalFilters?['minCarbs'],
      maxCarbs: additionalFilters?['maxCarbs'],
      minFat: additionalFilters?['minFat'],
      maxFat: additionalFilters?['maxFat'],
      minProtein: additionalFilters?['minProtein'],
      maxProtein: additionalFilters?['maxProtein'],
      minTotalTime: additionalFilters?['minTotalTime'],
      maxTotalTime: additionalFilters?['maxTotalTime'],
      minDifficultyRating: additionalFilters?['minDifficultyRating'],
      maxDifficultyRating: additionalFilters?['maxDifficultyRating'],
      minTasteRating: additionalFilters?['minTasteRating'],
      maxTasteRating: additionalFilters?['maxTasteRating'],
      minHealthRating: additionalFilters?['minHealthRating'],
      maxHealthRating: additionalFilters?['maxHealthRating'],
      hasImage: additionalFilters?['hasImage'],
      isApproved: additionalFilters?['isApproved'],
      excludeAllergens: additionalFilters?['excludeAllergens'],
      dietInfo: additionalFilters?['dietInfo'],
      pageSize: additionalFilters?['pageSize'] ?? 10,
    );

    return result['recipes'] as List<Recipe>;
  }

  /// Get random recipes for meal planning (shuffle results)
  Future<Map<String, List<Recipe>>> getRandomDailyMealPlan({
    Map<String, dynamic>? filters,
    int recipesPerMealType = 3,
  }) async {
    // Get recipes for each meal type
    final breakfastRecipes = await getRecipesForMealType(
      'breakfast',
      additionalFilters: {
        ...?filters,
        'pageSize': recipesPerMealType * 2, // Get more to shuffle
      },
    );

    final lunchRecipes = await getRecipesForMealType(
      'lunch',
      additionalFilters: {...?filters, 'pageSize': recipesPerMealType * 2},
    );

    final dinnerRecipes = await getRecipesForMealType(
      'dinner',
      additionalFilters: {...?filters, 'pageSize': recipesPerMealType * 2},
    );

    // Shuffle and limit results for randomness
    breakfastRecipes.shuffle();
    lunchRecipes.shuffle();
    dinnerRecipes.shuffle();

    return {
      'breakfast': breakfastRecipes.take(recipesPerMealType).toList(),
      'lunch': lunchRecipes.take(recipesPerMealType).toList(),
      'dinner': dinnerRecipes.take(recipesPerMealType).toList(),
    };
  }
}

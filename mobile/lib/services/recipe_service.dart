import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/recipe.dart';
import '../models/ingredient.dart';
import '../models/paginated_recipes.dart';
import 'storage_service.dart';

class RecipeService {
  static const String baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:8000');
  String? token;

  RecipeService({this.token});

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

  Future<List<Recipe>> getAllRecipes({int? page, int? pageSize}) async {
    String url = '$baseUrl/recipes/'; // Removed /api prefix for recipes
    Map<String, String> queryParams = {};
    if (page != null) {
      queryParams['page'] = page.toString();
    }
    if (pageSize != null) {
      queryParams['page_size'] = pageSize.toString();
    }
    if (queryParams.isNotEmpty) {
      url += '?' + Uri(queryParameters: queryParams).query;
    }

    token = await StorageService.getJwtAccessToken();
    if (token == null || token!.isEmpty) {
      throw Exception(
        'JWT Access token is not available. Please log in again.',
      );
    }

    try {
      print('RecipeService: Fetching recipes from $url');
      var response = await http.get(Uri.parse(url), headers: headers);
      print('RecipeService: Response status code: ${response.statusCode}');

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(Uri.parse(url), headers: headers);
        print(
          'RecipeService: After refresh - status code: ${response.statusCode}',
        );
      }

      if (response.statusCode == 200) {
        print('RecipeService: Parsing response body');
        final Map<String, dynamic> responseData = json.decode(response.body);
        final List<dynamic> results =
            responseData['results'] as List<dynamic>? ?? [];

        print('RecipeService: Found ${results.length} recipes');

        List<Recipe> recipes = [];
        for (var data in results) {
          try {
            final recipe = Recipe.fromListJson(data as Map<String, dynamic>);
            recipes.add(recipe);
          } catch (e) {
            print('RecipeService: Error parsing recipe: $e');
            print('RecipeService: Recipe data: $data');
            // Skip this recipe and continue with others
          }
        }

        print('RecipeService: Successfully parsed ${recipes.length} recipes');
        return recipes;
      } else if (response.statusCode == 500) {
        // Backend may fail computing recipe costs for some ingredients.
        print('RecipeService: Backend returned 500 error');
        print('RecipeService: Response body: ${response.body}');
        // Don't crash the app; return an empty list and let UI continue.
        return <Recipe>[];
      } else {
        // Consider more specific error handling based on status code
        print('RecipeService: Unexpected status code: ${response.statusCode}');
        print('RecipeService: Response body: ${response.body}');
        throw Exception(
          'Failed to load recipes (status code: ${response.statusCode})',
        );
      }
    } catch (e) {
      // Handle network errors or other exceptions without breaking the app
      print('RecipeService: Exception occurred: $e');
      return <Recipe>[];
    }
  }

  /// Fetches recipes with pagination metadata
  Future<PaginatedRecipes> getPaginatedRecipes({
    int page = 1,
    int pageSize = 10,
  }) async {
    String url = '$baseUrl/recipes/'; // Removed /api prefix for recipes
    Map<String, String> queryParams = {
      'page': page.toString(),
      'page_size': pageSize.toString(),
    };

    url += '?' + Uri(queryParameters: queryParams).query;

    token = await StorageService.getJwtAccessToken();
    if (token == null || token!.isEmpty) {
      throw Exception(
        'JWT Access token is not available. Please log in again.',
      );
    }

    try {
      print('RecipeService: Fetching paginated recipes from $url');
      var response = await http.get(Uri.parse(url), headers: headers);
      print('RecipeService: Response status code: ${response.statusCode}');

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(Uri.parse(url), headers: headers);
        print(
          'RecipeService: After refresh - status code: ${response.statusCode}',
        );
      }

      if (response.statusCode == 200) {
        print('RecipeService: Parsing paginated response body');
        final Map<String, dynamic> responseData = json.decode(response.body);

        final paginatedRecipes = PaginatedRecipes.fromJson(
          responseData,
          fallbackPage: page,
          fallbackPageSize: pageSize,
        );
        print(
          'RecipeService: Successfully parsed ${paginatedRecipes.results.length} recipes on page ${paginatedRecipes.page}',
        );

        return paginatedRecipes;
      } else if (response.statusCode == 500) {
        // Backend may fail computing recipe costs for some ingredients.
        print('RecipeService: Backend returned 500 error');
        print('RecipeService: Response body: ${response.body}');
        // Return empty paginated result
        return PaginatedRecipes(
          page: page,
          pageSize: pageSize,
          total: 0,
          results: <Recipe>[],
        );
      } else {
        print('RecipeService: Unexpected status code: ${response.statusCode}');
        print('RecipeService: Response body: ${response.body}');
        throw Exception(
          'Failed to load recipes (status code: ${response.statusCode})',
        );
      }
    } catch (e) {
      // Handle network errors or other exceptions without breaking the app
      print('RecipeService: Exception occurred: $e');
      return PaginatedRecipes(
        page: page,
        pageSize: pageSize,
        total: 0,
        results: <Recipe>[],
      );
    }
  }

  /// Fetches filtered recipes from meal_planner endpoint with pagination
  /// Supports all backend filters
  Future<PaginatedRecipes> getFilteredRecipes({
    int page = 1,
    int pageSize = 10,
    String? name,
    String? mealType,
    double? minCostPerServing,
    double? maxCostPerServing,
    int? minPrepTime,
    int? maxPrepTime,
    int? minCookTime,
    int? maxCookTime,
    int? minTotalTime,
    int? maxTotalTime,
    double? minCalories,
    double? maxCalories,
    double? minProtein,
    double? maxProtein,
    double? minCarbs,
    double? maxCarbs,
    double? minFat,
    double? maxFat,
    double? minDifficultyRating,
    double? maxDifficultyRating,
    double? minTasteRating,
    double? maxTasteRating,
    double? minHealthRating,
    double? maxHealthRating,
    int? minLikeCount,
    int? maxLikeCount,
    String? excludeAllergens,
    bool? hasImage,
    bool? isApproved,
    bool? isFeatured,
  }) async {
    String url = '$baseUrl/recipes/meal_planner/';
    Map<String, String> queryParams = {
      'page': page.toString(),
      'page_size': pageSize.toString(),
    };

    // Add optional filters
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

    // Nutrition filters
    if (minCalories != null) {
      queryParams['min_calories'] = minCalories.toString();
    }
    if (maxCalories != null) {
      queryParams['max_calories'] = maxCalories.toString();
    }
    if (minProtein != null) {
      queryParams['min_protein'] = minProtein.toString();
    }
    if (maxProtein != null) {
      queryParams['max_protein'] = maxProtein.toString();
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

    // Like count filters
    if (minLikeCount != null) {
      queryParams['min_like_count'] = minLikeCount.toString();
    }
    if (maxLikeCount != null) {
      queryParams['max_like_count'] = maxLikeCount.toString();
    }

    // Other filters
    if (excludeAllergens != null && excludeAllergens.isNotEmpty) {
      queryParams['exclude_allergens'] = excludeAllergens;
    }
    if (hasImage != null) {
      queryParams['has_image'] = hasImage.toString();
    }
    if (isApproved != null) {
      queryParams['is_approved'] = isApproved.toString();
    }
    if (isFeatured != null) {
      queryParams['is_featured'] = isFeatured.toString();
    }

    url += '?' + Uri(queryParameters: queryParams).query;

    token = await StorageService.getJwtAccessToken();
    if (token == null || token!.isEmpty) {
      throw Exception(
        'JWT Access token is not available. Please log in again.',
      );
    }

    try {
      print('RecipeService: Fetching filtered recipes from $url');
      var response = await http.get(Uri.parse(url), headers: headers);
      print('RecipeService: Response status code: ${response.statusCode}');

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(Uri.parse(url), headers: headers);
        print(
          'RecipeService: After refresh - status code: ${response.statusCode}',
        );
      }

      if (response.statusCode == 200) {
        print('RecipeService: Parsing filtered response body');
        final Map<String, dynamic> responseData = json.decode(response.body);

        final paginatedRecipes = PaginatedRecipes.fromJson(
          responseData,
          fallbackPage: page,
          fallbackPageSize: pageSize,
        );
        print(
          'RecipeService: Successfully parsed ${paginatedRecipes.results.length} filtered recipes on page ${paginatedRecipes.page}',
        );

        return paginatedRecipes;
      } else if (response.statusCode == 500) {
        print('RecipeService: Backend returned 500 error');
        print('RecipeService: Response body: ${response.body}');
        return PaginatedRecipes(
          page: page,
          pageSize: pageSize,
          total: 0,
          results: <Recipe>[],
        );
      } else {
        print('RecipeService: Unexpected status code: ${response.statusCode}');
        print('RecipeService: Response body: ${response.body}');
        throw Exception(
          'Failed to load filtered recipes (status code: ${response.statusCode})',
        );
      }
    } catch (e) {
      print('RecipeService: Exception occurred: $e');
      return PaginatedRecipes(
        page: page,
        pageSize: pageSize,
        total: 0,
        results: <Recipe>[],
      );
    }
  }

  // Fetches detailed information for a specific recipe by its ID.
  Future<Recipe> getRecipeDetails(int recipeId) async {
    final String url =
        '$baseUrl/recipes/$recipeId/'; // Removed /api prefix for recipes

    token = await StorageService.getJwtAccessToken();
    if (token == null || token!.isEmpty) {
      throw Exception(
        'JWT Access token is not available. Please log in again.',
      );
    }

    try {
      var response = await http.get(Uri.parse(url), headers: headers);

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(Uri.parse(url), headers: headers);
      }

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);
        return Recipe.fromJson(responseData);
      } else {
        throw Exception(
          'Failed to load recipe details (status code: ${response.statusCode})',
        );
      }
    } catch (e) {
      throw Exception('Failed to load recipe details: $e');
    }
  }

  // Creates a new recipe with optional image.
  // imagePath: Optional file path to the image to upload
  Future<bool> createRecipe(
    Map<String, dynamic> recipeData, {
    String? imagePath,
  }) async {
    final String url = '$baseUrl/recipes/'; // Removed /api prefix for recipes

    token = await StorageService.getJwtAccessToken();
    if (token == null || token!.isEmpty) {
      throw Exception(
        'JWT Access token is not available. Please log in again.',
      );
    }

    try {
      // Use multipart/form-data instead of JSON because backend uses MultiPartParser
      var request = http.MultipartRequest('POST', Uri.parse(url));

      // Add authorization header
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      print('RecipeService: Creating recipe with data: $recipeData');

      // Add form fields
      recipeData.forEach((key, value) {
        if (value != null && key != 'image') {
          if (key == 'steps' && value is List) {
            // For steps ListField, send as indexed array format
            for (int i = 0; i < value.length; i++) {
              request.fields['steps[$i]'] = value[i].toString();
              print('RecipeService: Added steps[$i] = ${value[i]}');
            }
          } else if (value is List || value is Map) {
            // For other complex data (like ingredients), send as JSON strings
            final jsonValue = json.encode(value);
            request.fields[key] = jsonValue;
            print('RecipeService: Added $key = $jsonValue');
          } else {
            request.fields[key] = value.toString();
            print('RecipeService: Added $key = ${value.toString()}');
          }
        }
      });

      print('RecipeService: Request fields: ${request.fields}');

      // Add image file if provided
      if (imagePath != null && imagePath.isNotEmpty) {
        var file = File(imagePath);
        if (await file.exists()) {
          var multipartFile = await http.MultipartFile.fromPath(
            'image', // Backend expects 'image' field name
            imagePath,
          );
          request.files.add(multipartFile);
          print('RecipeService: Added image file: $imagePath');
        }
      }

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      print('RecipeService: Response status: ${response.statusCode}');
      print('RecipeService: Response body: ${response.body}');

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        // Retry with refreshed token
        request = http.MultipartRequest('POST', Uri.parse(url));
        if (token != null) {
          request.headers['Authorization'] = 'Bearer $token';
        }
        recipeData.forEach((key, value) {
          if (value != null && key != 'image') {
            if (key == 'steps' && value is List) {
              // For steps ListField, send as indexed array format
              for (int i = 0; i < value.length; i++) {
                request.fields['steps[$i]'] = value[i].toString();
              }
            } else if (value is List || value is Map) {
              // For other complex data (like ingredients), send as JSON strings
              request.fields[key] = json.encode(value);
            } else {
              request.fields[key] = value.toString();
            }
          }
        });

        // Re-add image file
        if (imagePath != null && imagePath.isNotEmpty) {
          var file = File(imagePath);
          if (await file.exists()) {
            var multipartFile = await http.MultipartFile.fromPath(
              'image',
              imagePath,
            );
            request.files.add(multipartFile);
          }
        }

        streamedResponse = await request.send();
        response = await http.Response.fromStream(streamedResponse);
      }

      if (response.statusCode == 201) {
        // 201 Created for successful POST
        return true;
      } else {
        // Log or handle specific error messages from backend if available
        print(
          'Failed to create recipe. Status: ${response.statusCode}, Body: ${response.body}',
        );
        throw Exception(
          'Failed to create recipe (status code: ${response.statusCode})',
        );
      }
    } catch (e) {
      print('Error creating recipe: $e');
      throw Exception('Failed to create recipe: $e');
    }
  }

  // Fetches all ingredients.
  Future<List<IngredientDetail>> getAllIngredients({
    int? page,
    int? pageSize,
  }) async {
    String url = '$baseUrl/ingredients/'; // Endpoint for ingredients
    Map<String, String> queryParams = {};
    if (page != null) {
      queryParams['page'] = page.toString();
    }
    if (pageSize != null) {
      queryParams['page_size'] = pageSize.toString();
    }

    if (queryParams.isNotEmpty) {
      url += '?' + Uri(queryParameters: queryParams).query;
    }

    try {
      var response = await http.get(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);
        final List<dynamic> results =
            responseData['results'] as List<dynamic>? ?? [];

        List<IngredientDetail> ingredients =
            results
                .map(
                  (data) =>
                      IngredientDetail.fromJson(data as Map<String, dynamic>),
                )
                .toList();
        return ingredients;
      } else {
        throw Exception(
          'Failed to load ingredients (status code: ${response.statusCode})',
        );
      }
    } catch (e) {
      throw Exception('Failed to load ingredients: $e');
    }
  }

  // Bookmarks a recipe for the current user.
  Future<bool> bookmarkRecipe(int recipeId) async {
    final String url = '$baseUrl/api/users/bookmark_recipe/';

    token = await StorageService.getJwtAccessToken();
    if (token == null || token!.isEmpty) {
      throw Exception(
        'JWT Access token is not available. Please log in again.',
      );
    }

    try {
      var response = await http.post(
        Uri.parse(url),
        headers: headers,
        body: jsonEncode({'recipe_id': recipeId}),
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.post(
          Uri.parse(url),
          headers: headers,
          body: jsonEncode({'recipe_id': recipeId}),
        );
      }

      if (response.statusCode == 200) {
        return true;
      } else {
        throw Exception(
          'Failed to bookmark recipe (status code: ${response.statusCode})',
        );
      }
    } catch (e) {
      throw Exception('Failed to bookmark recipe: $e');
    }
  }

  // Unbookmarks a recipe for the current user.
  Future<bool> unbookmarkRecipe(int recipeId) async {
    final String url = '$baseUrl/api/users/unbookmark_recipe/';

    token = await StorageService.getJwtAccessToken();
    if (token == null || token!.isEmpty) {
      throw Exception(
        'JWT Access token is not available. Please log in again.',
      );
    }

    try {
      var response = await http.post(
        Uri.parse(url),
        headers: headers,
        body: jsonEncode({'recipe_id': recipeId}),
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.post(
          Uri.parse(url),
          headers: headers,
          body: jsonEncode({'recipe_id': recipeId}),
        );
      }

      if (response.statusCode == 200) {
        return true;
      } else if (response.statusCode == 400) {
        // Recipe not bookmarked or missing recipe_id
        final responseBody = jsonDecode(response.body);
        throw Exception(responseBody['error'] ?? 'Bad request');
      } else if (response.statusCode == 404) {
        // Recipe not found
        final responseBody = jsonDecode(response.body);
        throw Exception(responseBody['error'] ?? 'Recipe not found');
      } else {
        throw Exception(
          'Failed to unbookmark recipe (status code: ${response.statusCode})',
        );
      }
    } catch (e) {
      throw Exception('Failed to unbookmark recipe: $e');
    }
  }
}

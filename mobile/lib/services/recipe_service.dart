import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/recipe.dart';
import 'storage_service.dart'; // For JWT token

class RecipeService {
  // For Android emulator, 10.0.2.2 typically maps to host's localhost.
  // For iOS simulator, localhost or 127.0.0.1 should work.
  // Replace with your actual backend URL if deployed.
  static const String _baseHost = 'http://10.0.2.2:8000';

  // Fetches a list of all recipes, with optional pagination.
  Future<List<Recipe>> getAllRecipes({int? page, int? pageSize}) async {
    String url = '$_baseHost/recipes/'; // Removed /api prefix for recipes
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

    final jwtAccessToken =
        await StorageService.getJwtAccessToken(); // Use JWT access token
    if (jwtAccessToken == null || jwtAccessToken.isEmpty) {
      throw Exception(
        'JWT Access token is not available. Please log in again.',
      );
    }
    final headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $jwtAccessToken', // Use JWT access token
    };

    try {
      final response = await http.get(Uri.parse(url), headers: headers);

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);
        final List<dynamic> results =
            responseData['results'] as List<dynamic>? ?? [];

        List<Recipe> recipes =
            results
                .map(
                  (data) => Recipe.fromListJson(data as Map<String, dynamic>),
                )
                .toList();
        return recipes;
      } else {
        // Consider more specific error handling based on status code
        throw Exception(
          'Failed to load recipes (status code: ${response.statusCode})',
        );
      }
    } catch (e) {
      // Handle network errors or other exceptions
      throw Exception('Failed to load recipes: $e');
    }
  }

  // Fetches detailed information for a specific recipe by its ID.
  Future<Recipe> getRecipeDetails(int recipeId) async {
    final String url =
        '$_baseHost/recipes/$recipeId/'; // Removed /api prefix for recipes

    final jwtAccessToken =
        await StorageService.getJwtAccessToken(); // Use JWT access token
    if (jwtAccessToken == null || jwtAccessToken.isEmpty) {
      throw Exception(
        'JWT Access token is not available. Please log in again.',
      );
    }
    final headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $jwtAccessToken', // Use JWT access token
    };

    try {
      final response = await http.get(Uri.parse(url), headers: headers);

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

  // Creates a new recipe.
  Future<bool> createRecipe(Map<String, dynamic> recipeData) async {
    const String url = '$_baseHost/recipes/'; // Removed /api prefix for recipes

    final jwtAccessToken = await StorageService.getJwtAccessToken();
    if (jwtAccessToken == null || jwtAccessToken.isEmpty) {
      throw Exception(
        'JWT Access token is not available. Please log in again.',
      );
    }
    final headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $jwtAccessToken',
    };

    try {
      final response = await http.post(
        Uri.parse(url),
        headers: headers,
        body: json.encode(recipeData),
      );

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
}

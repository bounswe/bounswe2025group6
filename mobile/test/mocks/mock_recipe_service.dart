import 'package:fithub/services/recipe_service.dart';
import 'package:fithub/models/recipe.dart';
import 'package:mocktail/mocktail.dart';

// A mock class for RecipeService using mocktail
class MockRecipeService extends Mock implements RecipeService {}

// Helper function to create a sample Recipe for testing
Recipe getMockRecipe({
  int id = 1,
  String name = 'Test Recipe',
  List<String> steps = const ['Step 1', 'Step 2'],
  int prepTime = 10,
  int cookTime = 20,
  String mealType = 'breakfast',
  int creatorId = 1,
  String? imageFullUrl,
  double? costPerServing,
  int likeCount = 0,
  int commentCount = 0,
  bool isApproved = true,
  bool isFeatured = false,
}) {
  return Recipe(
    id: id,
    name: name,
    steps: steps,
    prepTime: prepTime,
    cookTime: cookTime,
    mealType: mealType,
    creatorId: creatorId,
    ingredients: [],
    likeCount: likeCount,
    commentCount: commentCount,
    difficultyRatingCount: 0,
    tasteRatingCount: 0,
    healthRatingCount: 0,
    isApproved: isApproved,
    isFeatured: isFeatured,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
    totalTime: prepTime + cookTime,
    totalUserRatings: 0,
    totalRatings: 0,
    allergens: [],
    dietaryInfo: [],
    imageFullUrl: imageFullUrl,
    imageRelativeUrl: null,
    costPerServing: costPerServing,
  );
}

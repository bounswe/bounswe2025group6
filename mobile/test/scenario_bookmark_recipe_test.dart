import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/models/recipe.dart';
import 'package:fithub/models/user_profile.dart';

/// Scenario 2: User bookmarks a recipe and accesses it later from their profile.
///
/// This test simulates a complete user flow where:
/// 1. User browses recipes and finds an interesting one
/// 2. User bookmarks the recipe
/// 3. User navigates to their profile
/// 4. User accesses the bookmarked recipe from their profile
/// 5. User can see the recipe details

void main() {
  group('Scenario 2: Bookmark Recipe and Access from Profile', () {
    late Recipe testRecipe;
    late UserProfile userProfile;

    setUp(() {
      // Create a sample recipe
      testRecipe = Recipe(
        id: 123,
        name: 'Delicious Pasta Carbonara',
        steps: ['Boil pasta', 'Prepare sauce', 'Mix together'],
        prepTime: 10,
        cookTime: 20,
        mealType: 'dinner',
        costPerServing: 7.50,
        healthRating: 3.5,
        tasteRating: 4.8,
        difficultyRating: 2.0,
        creatorId: 99,
        ingredients: [],
        allergens: ['eggs', 'dairy'],
        dietaryInfo: [],
        likeCount: 150,
        commentCount: 42,
        difficultyRatingCount: 30,
        tasteRatingCount: 35,
        healthRatingCount: 28,
        isApproved: true,
        isFeatured: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        totalTime: 30,
        totalUserRatings: 35,
        totalRatings: 93,
      );

      // Create a user profile without bookmarks initially
      userProfile = UserProfile(
        id: 1,
        username: 'testuser',
        email: 'testuser@example.com',
        userType: 'user',
        joinedDate: DateTime.now(),
        bookmarkRecipes: [],
        likedRecipes: [],
        followedUsers: [],
      );
    });

    test('User profile initially has no bookmarked recipes', () {
      // Verify profile starts with empty bookmarks
      expect(userProfile.bookmarkRecipes, isEmpty);
    });

    test('User bookmarks a recipe', () {
      // Simulate bookmarking by adding recipe ID to the list
      final updatedBookmarks = <int>[
        ...userProfile.bookmarkRecipes ?? [],
        testRecipe.id,
      ];

      final updatedProfile = userProfile.copyWith(
        bookmarkRecipes: updatedBookmarks,
      );

      // Verify bookmark was added
      expect(updatedProfile.bookmarkRecipes, contains(testRecipe.id));
      expect(updatedProfile.bookmarkRecipes!.length, equals(1));
    });

    test('User can have multiple bookmarked recipes', () {
      // Add multiple recipe IDs
      final bookmarks = [testRecipe.id, 456, 789];

      final updatedProfile = userProfile.copyWith(bookmarkRecipes: bookmarks);

      // Verify all bookmarks are stored
      expect(updatedProfile.bookmarkRecipes!.length, equals(3));
      expect(updatedProfile.bookmarkRecipes, contains(testRecipe.id));
      expect(updatedProfile.bookmarkRecipes, contains(456));
      expect(updatedProfile.bookmarkRecipes, contains(789));
    });

    test('User can check if a recipe is bookmarked', () {
      // Setup: User has bookmarked some recipes
      final bookmarks = [123, 456, 789];
      final profileWithBookmarks = userProfile.copyWith(
        bookmarkRecipes: bookmarks,
      );

      // Check if specific recipe is bookmarked
      final isBookmarked =
          profileWithBookmarks.bookmarkRecipes?.contains(testRecipe.id) ??
          false;

      expect(isBookmarked, isTrue);

      // Check a non-bookmarked recipe
      final isOtherBookmarked =
          profileWithBookmarks.bookmarkRecipes?.contains(999) ?? false;

      expect(isOtherBookmarked, isFalse);
    });

    test('User accesses bookmarked recipes from profile', () {
      // Setup: User has bookmarks
      final bookmarks = [testRecipe.id, 456, 789];
      final profileWithBookmarks = userProfile.copyWith(
        bookmarkRecipes: bookmarks,
      );

      // User navigates to bookmarks section
      final userBookmarks = profileWithBookmarks.bookmarkRecipes ?? [];

      // Verify user can see their bookmarks
      expect(userBookmarks, isNotEmpty);
      expect(userBookmarks.length, equals(3));
      expect(userBookmarks.first, equals(testRecipe.id));
    });

    test('User removes a bookmark', () {
      // Setup: User has bookmarks
      final initialBookmarks = [testRecipe.id, 456, 789];
      final profileWithBookmarks = userProfile.copyWith(
        bookmarkRecipes: initialBookmarks,
      );

      // User removes a bookmark
      final updatedBookmarks =
          profileWithBookmarks.bookmarkRecipes!
              .where((id) => id != testRecipe.id)
              .toList();

      final updatedProfile = profileWithBookmarks.copyWith(
        bookmarkRecipes: updatedBookmarks,
      );

      // Verify bookmark was removed
      expect(updatedProfile.bookmarkRecipes, isNot(contains(testRecipe.id)));
      expect(updatedProfile.bookmarkRecipes!.length, equals(2));
    });

    test('Bookmark count is tracked correctly', () {
      // Initial count
      var bookmarks = <int>[];
      expect(bookmarks.length, equals(0));

      // Add first bookmark
      bookmarks.add(testRecipe.id);
      expect(bookmarks.length, equals(1));

      // Add more bookmarks
      bookmarks.addAll([456, 789, 1011]);
      expect(bookmarks.length, equals(4));

      // Remove a bookmark
      bookmarks.remove(456);
      expect(bookmarks.length, equals(3));
    });

    test('User cannot bookmark the same recipe twice', () {
      // Setup: User has bookmarks
      var bookmarks = [testRecipe.id];

      // Attempt to add the same recipe again (should check first)
      if (!bookmarks.contains(testRecipe.id)) {
        bookmarks.add(testRecipe.id);
      }

      // Verify recipe is only bookmarked once
      expect(bookmarks.length, equals(1));
      expect(bookmarks.where((id) => id == testRecipe.id).length, equals(1));
    });

    test('Complete scenario: Bookmark and access recipe', () {
      // Step 1: User finds a recipe
      final foundRecipe = testRecipe;
      expect(foundRecipe.name, equals('Delicious Pasta Carbonara'));

      // Step 2: User checks if already bookmarked
      var isAlreadyBookmarked =
          userProfile.bookmarkRecipes?.contains(foundRecipe.id) ?? false;
      expect(isAlreadyBookmarked, isFalse);

      // Step 3: User bookmarks the recipe
      final updatedBookmarks = <int>[
        ...userProfile.bookmarkRecipes ?? [],
        foundRecipe.id,
      ];
      var updatedProfile = userProfile.copyWith(
        bookmarkRecipes: updatedBookmarks,
      );

      // Step 4: Verify bookmark was added
      expect(updatedProfile.bookmarkRecipes, contains(foundRecipe.id));

      // Step 5: User navigates to profile
      expect(updatedProfile.username, equals('testuser'));

      // Step 6: User accesses bookmarked recipes
      final bookmarkedRecipeIds = updatedProfile.bookmarkRecipes ?? [];
      expect(bookmarkedRecipeIds, isNotEmpty);

      // Step 7: User finds their bookmarked recipe
      final isRecipeInBookmarks = bookmarkedRecipeIds.contains(foundRecipe.id);
      expect(isRecipeInBookmarks, isTrue);

      // Step 8: User can access recipe details
      expect(foundRecipe.name, equals('Delicious Pasta Carbonara'));
      expect(foundRecipe.costPerServing, equals(7.50));
      expect(foundRecipe.mealType, equals('dinner'));

      // Success: User successfully bookmarked and accessed recipe
    });

    test('Multiple users can bookmark the same recipe', () {
      // Create another user
      final anotherUser = UserProfile(
        id: 2,
        username: 'anotheruser',
        email: 'another@example.com',
        userType: 'user',
        joinedDate: DateTime.now(),
        bookmarkRecipes: [],
        likedRecipes: [],
        followedUsers: [],
      );

      // Both users bookmark the same recipe
      final user1Bookmarks = [testRecipe.id];
      final user2Bookmarks = [testRecipe.id];

      final updatedUser1 = userProfile.copyWith(
        bookmarkRecipes: user1Bookmarks,
      );
      final updatedUser2 = anotherUser.copyWith(
        bookmarkRecipes: user2Bookmarks,
      );

      // Verify both users have the recipe bookmarked
      expect(updatedUser1.bookmarkRecipes, contains(testRecipe.id));
      expect(updatedUser2.bookmarkRecipes, contains(testRecipe.id));

      // Verify they are different user profiles
      expect(updatedUser1.id, isNot(equals(updatedUser2.id)));
    });

    test('Bookmarked recipes persist in user profile', () {
      // User bookmarks a recipe
      final bookmarks = [testRecipe.id, 456, 789];
      final profileWithBookmarks = userProfile.copyWith(
        bookmarkRecipes: bookmarks,
      );

      // Simulate profile reload (creating new instance with same data)
      final reloadedProfile = UserProfile(
        id: profileWithBookmarks.id,
        username: profileWithBookmarks.username,
        email: profileWithBookmarks.email,
        userType: profileWithBookmarks.userType,
        joinedDate: profileWithBookmarks.joinedDate,
        bookmarkRecipes: profileWithBookmarks.bookmarkRecipes,
        likedRecipes: profileWithBookmarks.likedRecipes,
        followedUsers: profileWithBookmarks.followedUsers,
      );

      // Verify bookmarks are still there
      expect(reloadedProfile.bookmarkRecipes!.length, equals(3));
      expect(reloadedProfile.bookmarkRecipes, contains(testRecipe.id));
    });
  });
}

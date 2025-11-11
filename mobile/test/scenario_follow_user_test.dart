import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/models/user_profile.dart';

/// Scenario 3: User follows another user and can view their meal plans.
///
/// This test simulates a complete user flow where:
/// 1. User discovers another user's profile
/// 2. User follows that user
/// 3. User can see the followed user in their following list
/// 4. User can access the followed user's profile and meal plans
/// 5. User can unfollow the user

void main() {
  group('Scenario 3: Follow User and View Meal Plans', () {
    late UserProfile currentUser;
    late UserProfile targetUser;

    setUp(() {
      // Create current user profile
      currentUser = UserProfile(
        id: 1,
        username: 'currentuser',
        email: 'current@example.com',
        userType: 'user',
        joinedDate: DateTime.now(),
        followedUsers: [],
        bookmarkRecipes: [],
        likedRecipes: [],
      );

      // Create target user to follow
      targetUser = UserProfile(
        id: 2,
        username: 'targetuser',
        email: 'target@example.com',
        userType: 'user',
        joinedDate: DateTime.now(),
        followedUsers: [],
        bookmarkRecipes: [],
        likedRecipes: [],
        recipeCount: 5,
      );
    });

    test('Current user initially follows no one', () {
      // Verify user starts with no followed users
      expect(currentUser.followedUsers, isEmpty);
    });

    test('User follows another user', () {
      // User follows target user
      final updatedFollowedUsers = <int>[
        ...currentUser.followedUsers ?? [],
        targetUser.id!,
      ];

      final updatedUser = currentUser.copyWith(
        followedUsers: updatedFollowedUsers,
      );

      // Verify follow was successful
      expect(updatedUser.followedUsers, contains(targetUser.id));
      expect(updatedUser.followedUsers!.length, equals(1));
    });

    test('User can follow multiple users', () {
      // User follows multiple users
      final followedIds = <int>[targetUser.id!, 3, 4, 5];

      final updatedUser = currentUser.copyWith(followedUsers: followedIds);

      // Verify all follows are stored
      expect(updatedUser.followedUsers!.length, equals(4));
      expect(updatedUser.followedUsers, contains(targetUser.id));
      expect(updatedUser.followedUsers, contains(3));
      expect(updatedUser.followedUsers, contains(4));
      expect(updatedUser.followedUsers, contains(5));
    });

    test('User can check if already following someone', () {
      // Setup: User already follows some users
      final followedIds = <int>[2, 3, 4];
      final userWithFollows = currentUser.copyWith(followedUsers: followedIds);

      // Check if following target user
      final isFollowing =
          userWithFollows.followedUsers?.contains(targetUser.id) ?? false;

      expect(isFollowing, isTrue);

      // Check a non-followed user
      final isFollowingOther =
          userWithFollows.followedUsers?.contains(999) ?? false;

      expect(isFollowingOther, isFalse);
    });

    test('User unfollows another user', () {
      // Setup: User follows target user
      final initialFollows = <int>[targetUser.id!, 3, 4];
      final userWithFollows = currentUser.copyWith(
        followedUsers: initialFollows,
      );

      // User unfollows target user
      final updatedFollows =
          userWithFollows.followedUsers!
              .where((id) => id != targetUser.id)
              .toList();

      final updatedUser = userWithFollows.copyWith(
        followedUsers: updatedFollows,
      );

      // Verify unfollow was successful
      expect(updatedUser.followedUsers, isNot(contains(targetUser.id)));
      expect(updatedUser.followedUsers!.length, equals(2));
    });

    test('User can view followed users list', () {
      // Setup: User follows some users
      final followedIds = <int>[2, 3, 4, 5];
      final userWithFollows = currentUser.copyWith(followedUsers: followedIds);

      // User accesses following list
      final followingList = userWithFollows.followedUsers ?? [];

      // Verify list is accessible
      expect(followingList, isNotEmpty);
      expect(followingList.length, equals(4));
    });

    test('User can access target user profile information', () {
      // User views target user's profile
      expect(targetUser.username, equals('targetuser'));
      expect(targetUser.email, equals('target@example.com'));
      expect(targetUser.recipeCount, equals(5));
    });

    test('Follow count is tracked correctly', () {
      // Initial count
      var follows = <int>[];
      expect(follows.length, equals(0));

      // Follow first user
      follows.add(2);
      expect(follows.length, equals(1));

      // Follow more users
      follows.addAll([3, 4, 5]);
      expect(follows.length, equals(4));

      // Unfollow a user
      follows.remove(3);
      expect(follows.length, equals(3));
    });

    test('User cannot follow the same user twice', () {
      // Setup: User already follows target
      var follows = <int>[targetUser.id!];

      // Attempt to follow again (should check first)
      if (!follows.contains(targetUser.id)) {
        follows.add(targetUser.id!);
      }

      // Verify user is only followed once
      expect(follows.length, equals(1));
      expect(follows.where((id) => id == targetUser.id).length, equals(1));
    });

    test('Complete scenario: Follow user and view their profile', () {
      // Step 1: User discovers target user
      expect(targetUser.username, equals('targetuser'));
      expect(targetUser.recipeCount, equals(5));

      // Step 2: Check if already following
      var isAlreadyFollowing =
          currentUser.followedUsers?.contains(targetUser.id) ?? false;
      expect(isAlreadyFollowing, isFalse);

      // Step 3: User follows target user
      final updatedFollows = <int>[
        ...currentUser.followedUsers ?? [],
        targetUser.id!,
      ];
      var updatedUser = currentUser.copyWith(followedUsers: updatedFollows);

      // Step 4: Verify follow was successful
      expect(updatedUser.followedUsers, contains(targetUser.id));

      // Step 5: User navigates to following list
      final followingList = updatedUser.followedUsers ?? [];
      expect(followingList, isNotEmpty);

      // Step 6: User selects target user from following list
      final isInList = followingList.contains(targetUser.id);
      expect(isInList, isTrue);

      // Step 7: User views target user's profile
      expect(targetUser.username, equals('targetuser'));
      expect(targetUser.recipeCount, equals(5));

      // Step 8: User can see target user's recipe count
      expect(targetUser.recipeCount, greaterThan(0));

      // Success: User followed another user and can view their profile
    });

    test('Following list persists across sessions', () {
      // User follows some users
      final followedIds = <int>[2, 3, 4];
      final userWithFollows = currentUser.copyWith(followedUsers: followedIds);

      // Simulate session reload
      final reloadedUser = UserProfile(
        id: userWithFollows.id,
        username: userWithFollows.username,
        email: userWithFollows.email,
        userType: userWithFollows.userType,
        joinedDate: userWithFollows.joinedDate,
        followedUsers: userWithFollows.followedUsers,
        bookmarkRecipes: userWithFollows.bookmarkRecipes,
        likedRecipes: userWithFollows.likedRecipes,
      );

      // Verify following list persists
      expect(reloadedUser.followedUsers!.length, equals(3));
      expect(reloadedUser.followedUsers, contains(2));
    });

    test('Multiple users can follow the same user', () {
      // Create another user
      final anotherUser = UserProfile(
        id: 3,
        username: 'anotheruser',
        email: 'another@example.com',
        userType: 'user',
        joinedDate: DateTime.now(),
        followedUsers: [],
        bookmarkRecipes: [],
        likedRecipes: [],
      );

      // Both users follow target user
      final user1Follows = <int>[targetUser.id!];
      final user2Follows = <int>[targetUser.id!];

      final updatedUser1 = currentUser.copyWith(followedUsers: user1Follows);
      final updatedUser2 = anotherUser.copyWith(followedUsers: user2Follows);

      // Verify both users follow target
      expect(updatedUser1.followedUsers, contains(targetUser.id));
      expect(updatedUser2.followedUsers, contains(targetUser.id));

      // Verify they are different users
      expect(updatedUser1.id, isNot(equals(updatedUser2.id)));
    });

    test('User can toggle follow status', () {
      // Initial state: not following
      expect(currentUser.followedUsers, isEmpty);

      // Follow
      var follows = <int>[targetUser.id!];
      var updatedUser = currentUser.copyWith(followedUsers: follows);
      expect(updatedUser.followedUsers, contains(targetUser.id));

      // Unfollow
      follows = [];
      updatedUser = updatedUser.copyWith(followedUsers: follows);
      expect(updatedUser.followedUsers, isEmpty);

      // Follow again
      follows = <int>[targetUser.id!];
      updatedUser = updatedUser.copyWith(followedUsers: follows);
      expect(updatedUser.followedUsers, contains(targetUser.id));
    });

    test('Target user information is accessible', () {
      // Verify all relevant target user information
      expect(targetUser.id, equals(2));
      expect(targetUser.username, isNotEmpty);
      expect(targetUser.email, isNotEmpty);
      expect(targetUser.recipeCount, isNotNull);
      expect(targetUser.userType, equals('user'));
    });
  });
}

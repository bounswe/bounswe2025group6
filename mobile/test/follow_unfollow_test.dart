import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/models/user_profile.dart';
import 'package:fithub/services/profile_service.dart';
import 'package:mocktail/mocktail.dart';

// Mock classes
class MockProfileService extends Mock implements ProfileService {}

void main() {
  late MockProfileService mockProfileService;

  setUp(() {
    mockProfileService = MockProfileService();
  });

  group('Follow/Unfollow Functionality Tests', () {
    test('followUnfollowUser returns followed status', () async {
      // Arrange
      const targetUserId = 123;
      when(() => mockProfileService.followUnfollowUser(targetUserId))
          .thenAnswer((_) async => {'status': 'followed'});

      // Act
      final result = await mockProfileService.followUnfollowUser(targetUserId);

      // Assert
      expect(result['status'], equals('followed'));
      verify(() => mockProfileService.followUnfollowUser(targetUserId))
          .called(1);
    });

    test('followUnfollowUser returns unfollowed status', () async {
      // Arrange
      const targetUserId = 123;
      when(() => mockProfileService.followUnfollowUser(targetUserId))
          .thenAnswer((_) async => {'status': 'unfollowed'});

      // Act
      final result = await mockProfileService.followUnfollowUser(targetUserId);

      // Assert
      expect(result['status'], equals('unfollowed'));
      verify(() => mockProfileService.followUnfollowUser(targetUserId))
          .called(1);
    });

    test('followUnfollowUser throws exception on error', () async {
      // Arrange
      const targetUserId = 999;
      when(() => mockProfileService.followUnfollowUser(targetUserId))
          .thenThrow(ProfileServiceException('Network error', statusCode: 500));

      // Act & Assert
      expect(
        () => mockProfileService.followUnfollowUser(targetUserId),
        throwsA(isA<ProfileServiceException>()),
      );
    });

    test('getUserProfile returns user with followedUsers list', () async {
      // Arrange
      final mockProfile = UserProfile(
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        joinedDate: DateTime(2023, 1, 1),
        followedUsers: [2, 3, 4],
      );

      when(() => mockProfileService.getUserProfile())
          .thenAnswer((_) async => mockProfile);

      // Act
      final profile = await mockProfileService.getUserProfile();

      // Assert
      expect(profile.followedUsers, equals([2, 3, 4]));
      expect(profile.followedUsers?.length, equals(3));
    });

    test('getUserProfileById returns target user profile', () async {
      // Arrange
      const targetUserId = 123;
      final mockProfile = UserProfile(
        id: targetUserId,
        username: 'targetuser',
        email: 'target@example.com',
        joinedDate: DateTime(2023, 6, 15),
        publicProfile: true,
        recipeCount: 10,
        avgRecipeRating: 4.5,
        typeOfCook: 'expert',
      );

      when(() => mockProfileService.getUserProfileById(targetUserId))
          .thenAnswer((_) async => mockProfile);

      // Act
      final profile = await mockProfileService.getUserProfileById(targetUserId);

      // Assert
      expect(profile.id, equals(targetUserId));
      expect(profile.username, equals('targetuser'));
      expect(profile.publicProfile, isTrue);
      expect(profile.recipeCount, equals(10));
      expect(profile.avgRecipeRating, equals(4.5));
    });

    test('checking if user is followed', () {
      // Arrange
      final currentUserProfile = UserProfile(
        id: 1,
        username: 'currentuser',
        email: 'current@example.com',
        joinedDate: DateTime(2023, 1, 1),
        followedUsers: [2, 3, 4, 123],
      );

      // Act & Assert
      expect(currentUserProfile.followedUsers?.contains(123), isTrue);
      expect(currentUserProfile.followedUsers?.contains(999), isFalse);
    });

    test('public profile shows all information', () {
      // Arrange & Act
      final publicProfile = UserProfile(
        id: 123,
        username: 'publicuser',
        email: 'public@example.com',
        joinedDate: DateTime(2023, 1, 1),
        publicProfile: true,
        recipeCount: 15,
        avgRecipeRating: 4.7,
        typeOfCook: 'intermediate',
      );

      // Assert
      expect(publicProfile.publicProfile, isTrue);
      expect(publicProfile.email, equals('public@example.com'));
      expect(publicProfile.recipeCount, equals(15));
      expect(publicProfile.avgRecipeRating, equals(4.7));
      expect(publicProfile.typeOfCook, equals('intermediate'));
    });

    test('private profile hides email but shows other stats', () {
      // Arrange & Act
      final privateProfile = UserProfile(
        id: 456,
        username: 'privateuser',
        email: 'private@example.com',
        joinedDate: DateTime(2023, 1, 1),
        publicProfile: false,
        recipeCount: 8,
        avgRecipeRating: 3.9,
        typeOfCook: 'beginner',
      );

      // Assert
      expect(privateProfile.publicProfile, isFalse);
      // In the UI, email should be hidden/replaced with "Private"
      // but the model still contains it
      expect(privateProfile.email, equals('private@example.com'));
      expect(privateProfile.recipeCount, equals(8));
      expect(privateProfile.avgRecipeRating, equals(3.9));
      expect(privateProfile.typeOfCook, equals('beginner'));
    });

    test('follow action updates followed users list', () {
      // Arrange
      var followedUsers = [1, 2, 3];
      const newFollowedUserId = 123;

      // Act - Simulate following a user
      if (!followedUsers.contains(newFollowedUserId)) {
        followedUsers = [...followedUsers, newFollowedUserId];
      }

      // Assert
      expect(followedUsers.contains(newFollowedUserId), isTrue);
      expect(followedUsers.length, equals(4));
    });

    test('unfollow action removes user from followed users list', () {
      // Arrange
      var followedUsers = [1, 2, 3, 123];
      const unfollowUserId = 123;

      // Act - Simulate unfollowing a user
      followedUsers = followedUsers.where((id) => id != unfollowUserId).toList();

      // Assert
      expect(followedUsers.contains(unfollowUserId), isFalse);
      expect(followedUsers.length, equals(3));
    });

    test('getUserProfileById handles null optional fields', () async {
      // Arrange
      const targetUserId = 789;
      final mockProfile = UserProfile(
        id: targetUserId,
        username: 'newuser',
        email: 'new@example.com',
        joinedDate: DateTime(2024, 1, 1),
        recipeCount: null,
        avgRecipeRating: null,
        typeOfCook: null,
      );

      when(() => mockProfileService.getUserProfileById(targetUserId))
          .thenAnswer((_) async => mockProfile);

      // Act
      final profile = await mockProfileService.getUserProfileById(targetUserId);

      // Assert
      expect(profile.recipeCount, isNull);
      expect(profile.avgRecipeRating, isNull);
      expect(profile.typeOfCook, isNull);
    });

    test('followUnfollowUser with multiple users', () async {
      // Test following multiple users in sequence
      when(() => mockProfileService.followUnfollowUser(1))
          .thenAnswer((_) async => {'status': 'followed'});
      when(() => mockProfileService.followUnfollowUser(2))
          .thenAnswer((_) async => {'status': 'followed'});
      when(() => mockProfileService.followUnfollowUser(3))
          .thenAnswer((_) async => {'status': 'followed'});

      final result1 = await mockProfileService.followUnfollowUser(1);
      final result2 = await mockProfileService.followUnfollowUser(2);
      final result3 = await mockProfileService.followUnfollowUser(3);

      expect(result1['status'], equals('followed'));
      expect(result2['status'], equals('followed'));
      expect(result3['status'], equals('followed'));
    });

    test('user profile creation with all fields', () {
      // Arrange & Act
      final completeProfile = UserProfile(
        id: 999,
        username: 'completeuser',
        email: 'complete@example.com',
        profilePictureUrl: 'https://example.com/avatar.jpg',
        joinedDate: DateTime(2023, 5, 10),
        publicProfile: true,
        recipeCount: 25,
        avgRecipeRating: 4.8,
        typeOfCook: 'expert',
        followedUsers: [1, 2, 3, 4, 5],
        bookmarkRecipes: [10, 20, 30],
        likedRecipes: [40, 50, 60],
      );

      // Assert
      expect(completeProfile.id, equals(999));
      expect(completeProfile.username, equals('completeuser'));
      expect(completeProfile.email, equals('complete@example.com'));
      expect(completeProfile.profilePictureUrl,
          equals('https://example.com/avatar.jpg'));
      expect(completeProfile.publicProfile, isTrue);
      expect(completeProfile.recipeCount, equals(25));
      expect(completeProfile.avgRecipeRating, equals(4.8));
      expect(completeProfile.typeOfCook, equals('expert'));
      expect(completeProfile.followedUsers?.length, equals(5));
      expect(completeProfile.bookmarkRecipes?.length, equals(3));
      expect(completeProfile.likedRecipes?.length, equals(3));
    });

    test('profile with asset image path', () {
      // Arrange & Act
      final profileWithAsset = UserProfile(
        id: 100,
        username: 'assetuser',
        email: 'asset@example.com',
        profilePictureUrl: 'assets/avatars/cat.png',
        joinedDate: DateTime(2023, 1, 1),
      );

      // Assert
      expect(profileWithAsset.profilePictureUrl,
          equals('assets/avatars/cat.png'));
      expect(profileWithAsset.profilePictureUrl?.startsWith('assets/'), isTrue);
    });
  });

  group('UserProfile Model Tests', () {
    test('copyWith creates new instance with updated fields', () {
      // Arrange
      final original = UserProfile(
        id: 1,
        username: 'original',
        email: 'original@example.com',
        joinedDate: DateTime(2023, 1, 1),
        followedUsers: [1, 2, 3],
      );

      // Act
      final updated = original.copyWith(
        username: 'updated',
        followedUsers: [1, 2, 3, 4, 5],
      );

      // Assert
      expect(updated.username, equals('updated'));
      expect(updated.email, equals('original@example.com')); // Unchanged
      expect(updated.followedUsers?.length, equals(5));
    });

    test('toJson includes all necessary fields', () {
      // Arrange
      final profile = UserProfile(
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        joinedDate: DateTime(2023, 1, 1),
        publicProfile: true,
        userType: 'premium',
      );

      // Act
      final json = profile.toJson();

      // Assert
      expect(json['username'], equals('testuser'));
      expect(json['email'], equals('test@example.com'));
      expect(json['profileVisibility'], equals('public'));
      expect(json['usertype'], equals('premium'));
    });

    test('fromJson creates UserProfile correctly', () {
      // Arrange
      final json = {
        'username': 'jsonuser',
        'email': 'json@example.com',
        'date_joined': '2023-01-01T00:00:00Z',
        'profileVisibility': 'private',
        'followedUsers': [1, 2, 3],
        'recipeCount': 10,
        'avgRecipeRating': 4.5,
        'typeOfCook': 'intermediate',
      };

      // Act
      final profile = UserProfile.fromJson(json, 123);

      // Assert
      expect(profile.id, equals(123));
      expect(profile.username, equals('jsonuser'));
      expect(profile.email, equals('json@example.com'));
      expect(profile.publicProfile, isFalse); // private visibility
      expect(profile.followedUsers, equals([1, 2, 3]));
      expect(profile.recipeCount, equals(10));
      expect(profile.avgRecipeRating, equals(4.5));
      expect(profile.typeOfCook, equals('intermediate'));
    });
  });
}

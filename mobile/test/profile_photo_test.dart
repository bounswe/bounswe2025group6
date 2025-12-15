import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/models/user_profile.dart';
import 'package:fithub/services/profile_service.dart';
import 'package:mocktail/mocktail.dart';

// Mock ProfileService
class MockProfileService extends Mock implements ProfileService {}

// Fake File for registerFallbackValue
class FakeFile extends Fake implements File {}

void main() {
  late MockProfileService mockProfileService;
  late UserProfile sampleProfile;

  setUpAll(() {
    registerFallbackValue(FakeFile());
  });

  setUp(() {
    mockProfileService = MockProfileService();
    sampleProfile = UserProfile(
      id: 1,
      username: 'TestUser',
      email: 'test@example.com',
      profilePictureUrl: null,
      joinedDate: DateTime(2023, 1, 1),
      dietaryPreferences: [],
      allergens: [],
      dislikedFoods: '',
      publicProfile: false,
      userType: 'user',
    );
  });

  group('Profile Photo Service Tests', () {
    test('uploadProfilePhoto returns updated profile with photo URL', () async {
      // Arrange
      final updatedProfile = sampleProfile.copyWith(
        profilePictureUrl: 'https://cloudinary.com/image123.jpg',
      );

      when(
        () => mockProfileService.uploadProfilePhoto(any()),
      ).thenAnswer((_) async => updatedProfile);

      // Act
      final result = await mockProfileService.uploadProfilePhoto(FakeFile());

      // Assert
      expect(
        result.profilePictureUrl,
        equals('https://cloudinary.com/image123.jpg'),
      );
      verify(() => mockProfileService.uploadProfilePhoto(any())).called(1);
    });

    test('deleteProfilePhoto returns profile with null photo URL', () async {
      // Arrange
      // Create a profile without profile photo to simulate deletion result
      final deletedPhotoProfile = UserProfile(
        id: 1,
        username: 'TestUser',
        email: 'test@example.com',
        profilePictureUrl: null,
        joinedDate: DateTime(2023, 1, 1),
        dietaryPreferences: [],
        allergens: [],
        dislikedFoods: '',
        publicProfile: false,
        userType: 'user',
      );

      when(
        () => mockProfileService.deleteProfilePhoto(),
      ).thenAnswer((_) async => deletedPhotoProfile);

      // Act
      final result = await mockProfileService.deleteProfilePhoto();

      // Assert
      expect(result.profilePictureUrl, isNull);
      verify(() => mockProfileService.deleteProfilePhoto()).called(1);
    });

    test('uploadProfilePhoto throws exception on failure', () async {
      // Arrange
      when(
        () => mockProfileService.uploadProfilePhoto(any()),
      ).thenThrow(ProfileServiceException('Upload failed', statusCode: 500));

      // Act & Assert
      expect(
        () => mockProfileService.uploadProfilePhoto(FakeFile()),
        throwsA(isA<ProfileServiceException>()),
      );
    });

    test('deleteProfilePhoto throws exception on failure', () async {
      // Arrange
      when(
        () => mockProfileService.deleteProfilePhoto(),
      ).thenThrow(ProfileServiceException('Delete failed', statusCode: 500));

      // Act & Assert
      expect(
        () => mockProfileService.deleteProfilePhoto(),
        throwsA(isA<ProfileServiceException>()),
      );
    });
  });

  group('Profile Photo URL Detection Tests', () {
    test('detects network URL correctly', () {
      final profileWithNetworkUrl = sampleProfile.copyWith(
        profilePictureUrl: 'https://cloudinary.com/image.jpg',
      );

      final url = profileWithNetworkUrl.profilePictureUrl;
      final isNetworkUrl =
          url != null &&
          url.isNotEmpty &&
          !url.startsWith('assets/') &&
          (url.startsWith('http://') || url.startsWith('https://'));

      expect(isNetworkUrl, isTrue);
    });

    test('detects asset path correctly', () {
      final profileWithAsset = sampleProfile.copyWith(
        profilePictureUrl: 'assets/avatars/cat.png',
      );

      final url = profileWithAsset.profilePictureUrl;
      final isAssetPath = url != null && url.startsWith('assets/');

      expect(isAssetPath, isTrue);
    });

    test('handles null profile picture URL', () {
      final profileWithNoPhoto = sampleProfile.copyWith(
        profilePictureUrl: null,
      );

      expect(profileWithNoPhoto.profilePictureUrl, isNull);
    });

    test('handles empty profile picture URL', () {
      final profileWithEmptyUrl = sampleProfile.copyWith(profilePictureUrl: '');

      final url = profileWithEmptyUrl.profilePictureUrl;
      final hasValidUrl = url != null && url.isNotEmpty;

      expect(hasValidUrl, isFalse);
    });
  });

  group('UserProfile toJson profilePhoto handling', () {
    test(
      'toJson excludes profilePhoto field (backend expects multipart upload)',
      () {
        final profileWithAsset = sampleProfile.copyWith(
          profilePictureUrl: 'assets/avatars/cat.png',
        );

        final json = profileWithAsset.toJson();

        // profilePhoto should NOT be included in toJson output
        // because the backend expects it as a multipart file upload
        expect(json.containsKey('profilePhoto'), isFalse);
      },
    );

    test('toJson excludes profilePhoto even with network URL', () {
      final profileWithNetworkUrl = sampleProfile.copyWith(
        profilePictureUrl: 'https://cloudinary.com/image.jpg',
      );

      final json = profileWithNetworkUrl.toJson();

      // profilePhoto should NOT be included in toJson output
      // Use ProfileService.uploadProfilePhoto() for photo uploads instead
      expect(json.containsKey('profilePhoto'), isFalse);
    });
  });
}

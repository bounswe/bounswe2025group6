import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/other_user_profile_screen.dart';
import 'package:fithub/models/user_profile.dart';
import 'package:fithub/services/profile_service.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:fithub/l10n/app_localizations.dart';

// Mock classes
class MockProfileService extends Mock implements ProfileService {}

void main() {
  late MockProfileService mockProfileService;

  setUp(() {
    mockProfileService = MockProfileService();
  });

  Widget createTestWidget(Widget child) {
    return MaterialApp(
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en', ''),
        Locale('tr', ''),
      ],
      home: child,
    );
  }

  group('OtherUserProfileScreen Widget Tests', () {
    testWidgets('displays public profile information', (WidgetTester tester) async {
      // Arrange
      final testProfile = UserProfile(
        id: 123,
        username: 'johndoe',
        email: 'john@example.com',
        joinedDate: DateTime(2023, 6, 15),
        publicProfile: true,
        recipeCount: 5,
        avgRecipeRating: 4.5,
        typeOfCook: 'Chef',
      );

      when(() => mockProfileService.getUserProfileById(123))
          .thenAnswer((_) async => testProfile);
      
      when(() => mockProfileService.getUserProfile())
          .thenAnswer((_) async => UserProfile(
                id: 1,
                username: 'currentuser',
                email: 'current@example.com',
                joinedDate: DateTime(2023, 1, 1),
                followedUsers: [],
              ));

      // Act
      await tester.pumpWidget(
        createTestWidget(
          OtherUserProfileScreen(
            userId: 123,
            profileService: mockProfileService,
          ),
        ),
      );

      // Wait for async operations to complete
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Assert - should display username and email (public profile)
      expect(find.text('johndoe'), findsOneWidget);
      expect(find.text('john@example.com'), findsOneWidget);
    });

    testWidgets('displays "Private" instead of email for private profiles', (WidgetTester tester) async {
      // Arrange
      final testProfile = UserProfile(
        id: 123,
        username: 'privateuser',
        email: 'private@example.com',
        joinedDate: DateTime(2023, 6, 15),
        publicProfile: false, // Private profile
        recipeCount: 3,
      );

      when(() => mockProfileService.getUserProfileById(123))
          .thenAnswer((_) async => testProfile);
      
      when(() => mockProfileService.getUserProfile())
          .thenAnswer((_) async => UserProfile(
                id: 1,
                username: 'currentuser',
                email: 'current@example.com',
                joinedDate: DateTime(2023, 1, 1),
                followedUsers: [],
              ));

      // Act
      await tester.pumpWidget(
        createTestWidget(
          OtherUserProfileScreen(
            userId: 123,
            profileService: mockProfileService,
          ),
        ),
      );

      // Wait for async operations
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Assert - should show "Private" instead of email
      expect(find.text('privateuser'), findsOneWidget);
      expect(find.text('Private'), findsOneWidget);
      expect(find.text('private@example.com'), findsNothing);
    });

    testWidgets('displays activity stats for public profiles', (WidgetTester tester) async {
      // Arrange
      final testProfile = UserProfile(
        id: 123,
        username: 'statsuser',
        email: 'stats@example.com',
        joinedDate: DateTime(2023, 1, 1),
        publicProfile: true,
        recipeCount: 10,
        avgRecipeRating: 4.8,
        typeOfCook: 'Home Cook',
      );

      when(() => mockProfileService.getUserProfileById(123))
          .thenAnswer((_) async => testProfile);
      
      when(() => mockProfileService.getUserProfile())
          .thenAnswer((_) async => UserProfile(
                id: 1,
                username: 'currentuser',
                email: 'current@example.com',
                joinedDate: DateTime(2023, 1, 1),
                followedUsers: [],
              ));

      // Act
      await tester.pumpWidget(
        createTestWidget(
          OtherUserProfileScreen(
            userId: 123,
            profileService: mockProfileService,
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Assert - should display activity stats
      expect(find.text('10'), findsOneWidget); // recipe count
      expect(find.textContaining('4.8'), findsOneWidget); // rating
      expect(find.text('Home Cook'), findsOneWidget); // cooking skill
    });

    testWidgets('displays activity stats for private profiles too', (WidgetTester tester) async {
      // Arrange
      final testProfile = UserProfile(
        id: 123,
        username: 'privatestatsuser',
        email: 'privatestats@example.com',
        joinedDate: DateTime(2023, 1, 1),
        publicProfile: false, // Private profile
        recipeCount: 7,
        avgRecipeRating: 3.5,
        typeOfCook: 'Beginner',
      );

      when(() => mockProfileService.getUserProfileById(123))
          .thenAnswer((_) async => testProfile);
      
      when(() => mockProfileService.getUserProfile())
          .thenAnswer((_) async => UserProfile(
                id: 1,
                username: 'currentuser',
                email: 'current@example.com',
                joinedDate: DateTime(2023, 1, 1),
                followedUsers: [],
              ));

      // Act
      await tester.pumpWidget(
        createTestWidget(
          OtherUserProfileScreen(
            userId: 123,
            profileService: mockProfileService,
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Assert - private profiles should still show stats
      expect(find.text('privatestatsuser'), findsOneWidget);
      expect(find.text('7'), findsOneWidget); // recipe count
      expect(find.text('Beginner'), findsOneWidget); // cooking skill
    });
  });
}

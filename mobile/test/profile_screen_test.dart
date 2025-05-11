import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/models/user_profile.dart';
import 'package:fithub/screens/profile_screen.dart';
import 'package:fithub/screens/profile_settings_screen.dart';
import 'package:fithub/services/profile_service.dart';
import 'package:fithub/theme/app_theme.dart';
import 'package:mocktail/mocktail.dart';

// Mocks
class MockProfileService extends Mock implements ProfileService {}

class FakeUserProfile extends Fake implements UserProfile {}

class MockNavigatorObserver extends Mock implements NavigatorObserver {}

// Helper to get a consistent mock UserProfile
UserProfile getMockUserProfile({
  String username = 'TestUser',
  String email = 'test@example.com',
  String profilePictureUrl = 'assets/avatars/cat.png',
  DateTime? joinedDate,
  List<String> dietaryPreferences = const ['Vegan'],
  List<String> allergens = const ['Nuts'],
  String dislikedFoods = 'Celery',
  double? monthlyBudget = 200.0,
  int householdSize = 1,
  bool publicProfile = false,
  String userType = 'Regular',
}) {
  return UserProfile(
    username: username,
    email: email,
    profilePictureUrl: profilePictureUrl,
    joinedDate: joinedDate ?? DateTime(2023, 1, 1),
    dietaryPreferences: List<String>.from(dietaryPreferences),
    allergens: List<String>.from(allergens),
    dislikedFoods: dislikedFoods,
    monthlyBudget: monthlyBudget,
    householdSize: householdSize,
    publicProfile: publicProfile,
    userType: userType,
  );
}

const List<String> _avatarPaths = [
  'assets/avatars/cat.png',
  'assets/avatars/dog.png',
  'assets/avatars/meerkat.png',
  'assets/avatars/panda.png',
  'assets/avatars/gorilla.png',
];

void main() {
  late MockProfileService mockProfileService;
  late UserProfile sampleUserProfile;
  late MockNavigatorObserver mockNavigatorObserver;

  setUpAll(() {
    registerFallbackValue(FakeUserProfile());
    registerFallbackValue(
      MaterialPageRoute<dynamic>(builder: (_) => Container()),
    );
  });

  setUp(() {
    mockProfileService = MockProfileService();
    sampleUserProfile = getMockUserProfile();
    mockNavigatorObserver = MockNavigatorObserver();

    // Default stubs
    when(
      () => mockProfileService.getUserProfile(),
    ).thenAnswer((_) async => sampleUserProfile);
    when(() => mockProfileService.updateUserProfile(any())).thenAnswer(
      (_) async => sampleUserProfile,
    ); // Changed to return UserProfile
    // when(
    //   () => mockProfileService.changePassword(any(), any()),
    // ).thenAnswer((_) async => true); // Commented out
    // when(
    //   () => mockProfileService.deleteAccount(any()),
    // ).thenAnswer((_) async => true); // Commented out
  });

  Future<void> pumpProfileScreen(WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: ProfileScreen(profileService: mockProfileService),
        routes: {
          ProfileSettingsScreen.routeName:
              (context) => ProfileSettingsScreen(
                userProfile: sampleUserProfile, // Provide a default or mock
                profileService: mockProfileService,
              ),
        },
        navigatorObservers: [mockNavigatorObserver],
      ),
    );
  }

  Future<void> pumpProfileSettingsScreen(
    WidgetTester tester,
    UserProfile userProfile,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: ProfileSettingsScreen(
          userProfile: userProfile,
          profileService: mockProfileService,
        ),
        navigatorObservers: [mockNavigatorObserver],
      ),
    );
  }

  group('ProfileScreen Tests', () {
    testWidgets(
      'displays CircularProgressIndicator then profile when loading',
      (WidgetTester tester) async {
        when(() => mockProfileService.getUserProfile()).thenAnswer((_) async {
          await Future.delayed(const Duration(milliseconds: 50));
          return sampleUserProfile;
        });

        await pumpProfileScreen(tester);
        expect(find.byType(CircularProgressIndicator), findsOneWidget);
        await tester.pumpAndSettle(); // Complete loading

        expect(find.text(sampleUserProfile.username), findsOneWidget);
        expect(find.text(sampleUserProfile.email), findsOneWidget);
        expect(find.byIcon(Icons.settings), findsOneWidget);
      },
    );

    testWidgets('displays error message and retry button on load failure', (
      WidgetTester tester,
    ) async {
      when(
        () => mockProfileService.getUserProfile(),
      ).thenThrow(Exception('Network error'));

      await pumpProfileScreen(tester);
      await tester.pumpAndSettle(); // Complete error handling

      expect(
        find.textContaining('Failed to load profile: Exception: Network error'),
        findsOneWidget,
      );
      expect(find.widgetWithText(ElevatedButton, 'Retry'), findsOneWidget);

      // Tap retry
      when(
        () => mockProfileService.getUserProfile(),
      ).thenAnswer((_) async => sampleUserProfile); // Setup success for retry
      await tester.tap(find.widgetWithText(ElevatedButton, 'Retry'));
      await tester.pumpAndSettle();

      expect(find.text(sampleUserProfile.username), findsOneWidget);
      verify(() => mockProfileService.getUserProfile()).called(2);
    });

    testWidgets('navigates to ProfileSettingsScreen on settings icon tap', (
      WidgetTester tester,
    ) async {
      await pumpProfileScreen(tester);
      await tester.pumpAndSettle(); // Ensure profile is loaded

      await tester.tap(find.byIcon(Icons.settings));
      await tester.pumpAndSettle();

      expect(find.byType(ProfileSettingsScreen), findsOneWidget);
      expect(find.widgetWithText(AppBar, 'Profile Settings'), findsOneWidget);
    });

    testWidgets('updates profile data if settings screen returns UserProfile', (
      WidgetTester tester,
    ) async {
      await pumpProfileScreen(tester);
      await tester.pumpAndSettle();

      final updatedProfile = sampleUserProfile.copyWith(
        username: 'UpdatedUser',
      );

      await tester.tap(find.byIcon(Icons.settings));
      await tester.pumpAndSettle();

      Navigator.of(
        tester.element(find.byType(ProfileSettingsScreen)),
      ).pop(updatedProfile);
      await tester.pumpAndSettle();

      expect(find.text('UpdatedUser'), findsOneWidget);
      expect(
        find.text(sampleUserProfile.email),
        findsOneWidget,
      ); // Email shouldn't change here
      verify(
        () => mockProfileService.getUserProfile(),
      ).called(1); // Not reloaded from service
    });
  });
}

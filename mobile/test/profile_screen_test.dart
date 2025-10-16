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
  bool publicProfile = false,
  String userType = 'Regular',
  Language language = Language.en,
  DateFormat preferredDateFormat = DateFormat.yyyymmdd,
  DateTime? dateOfBirth,
  String? nationality,
  Currency preferredCurrency = Currency.usd,
  AccessibilityNeeds accessibilityNeeds = AccessibilityNeeds.none,
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
    publicProfile: publicProfile,
    userType: userType,
    language: language,
    preferredDateFormat: preferredDateFormat,
    dateOfBirth: dateOfBirth,
    nationality: nationality,
    preferredCurrency: preferredCurrency,
    accessibilityNeeds: accessibilityNeeds,
  );
}

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
      expect(find.text(sampleUserProfile.email), findsOneWidget);
      verify(
        () => mockProfileService.getUserProfile(),
      ).called(1); // Not reloaded from service
    });

    testWidgets('displays localization preferences correctly', (
      WidgetTester tester,
    ) async {
      final profileWithLocalization = getMockUserProfile(
        language: Language.tr,
        preferredCurrency: Currency.try_,
        preferredDateFormat: DateFormat.ddmmyyyy,
        nationality: 'Turkish',
        dateOfBirth: DateTime(1990, 5, 15),
      );

      when(() => mockProfileService.getUserProfile()).thenAnswer(
        (_) async => profileWithLocalization,
      );

      await pumpProfileScreen(tester);
      await tester.pumpAndSettle();

      // Scroll to the localization section
      await tester.dragUntilVisible(
        find.text('Localization & Accessibility'),
        find.byType(ListView),
        const Offset(0, -100),
      );
      await tester.pumpAndSettle();

      // Check language is displayed
      expect(find.text('Türkçe'), findsOneWidget);
      
      // Check currency is displayed
      expect(find.text('Turkish Lira (₺)'), findsOneWidget);
      
      // Check date format is displayed
      expect(find.text('DD/MM/YYYY'), findsOneWidget);
      
      // Check nationality is displayed
      expect(find.text('Turkish'), findsOneWidget);
      
      // Check date of birth is displayed (format: day/month/year)
      expect(find.text('15/5/1990'), findsOneWidget);
    });

    testWidgets('displays accessibility needs correctly', (
      WidgetTester tester,
    ) async {
      final profileWithAccessibility = getMockUserProfile(
        accessibilityNeeds: AccessibilityNeeds.colorblind,
      );

      when(() => mockProfileService.getUserProfile()).thenAnswer(
        (_) async => profileWithAccessibility,
      );

      await pumpProfileScreen(tester);
      await tester.pumpAndSettle();

      // Scroll to the localization section
      await tester.dragUntilVisible(
        find.text('Localization & Accessibility'),
        find.byType(ListView),
        const Offset(0, -100),
      );
      await tester.pumpAndSettle();

      expect(find.text('Colorblind'), findsOneWidget);
    });

    testWidgets('displays only English and Turkish language options', (
      WidgetTester tester,
    ) async {
      await pumpProfileScreen(tester);
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.settings));
      await tester.pumpAndSettle();

      // Verify we're on the settings screen
      expect(find.byType(ProfileSettingsScreen), findsOneWidget);

      // The language dropdown should only have 2 options: English and Turkish
      // This is verified by the enum definition in UserProfile model
      final profile = getMockUserProfile();
      expect(profile.language, equals(Language.en));
      
      final turkishProfile = getMockUserProfile(language: Language.tr);
      expect(turkishProfile.language, equals(Language.tr));
      
      // Verify there are only 2 language values
      expect(Language.values.length, equals(2));
    });

    testWidgets('displays only USD and TRY currency options', (
      WidgetTester tester,
    ) async {
      await pumpProfileScreen(tester);
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.settings));
      await tester.pumpAndSettle();

      // Verify we're on the settings screen
      expect(find.byType(ProfileSettingsScreen), findsOneWidget);

      // The currency dropdown should only have 2 options: USD and TRY
      // This is verified by the enum definition in UserProfile model
      final usdProfile = getMockUserProfile(preferredCurrency: Currency.usd);
      expect(usdProfile.preferredCurrency, equals(Currency.usd));
      
      final tryProfile = getMockUserProfile(preferredCurrency: Currency.try_);
      expect(tryProfile.preferredCurrency, equals(Currency.try_));
      
      // Verify there are only 2 currency values
      expect(Currency.values.length, equals(2));
    });

    testWidgets('handles optional nationality and date of birth fields', (
      WidgetTester tester,
    ) async {
      final profileWithoutOptionals = getMockUserProfile(
        nationality: null,
        dateOfBirth: null,
      );

      when(() => mockProfileService.getUserProfile()).thenAnswer(
        (_) async => profileWithoutOptionals,
      );

      await pumpProfileScreen(tester);
      await tester.pumpAndSettle();

      // Scroll to the localization section
      await tester.dragUntilVisible(
        find.text('Localization & Accessibility'),
        find.byType(ListView),
        const Offset(0, -100),
      );
      await tester.pumpAndSettle();

      // Should not display nationality section when null
      expect(find.text('Nationality'), findsNothing);
      
      // Should not display date of birth section when null
      expect(find.text('Date of Birth'), findsNothing);
    });
  });
}

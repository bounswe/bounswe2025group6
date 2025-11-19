import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/models/user_profile.dart';
import 'package:fithub/screens/profile_settings_screen.dart';
import 'package:fithub/screens/login_screen.dart';
import 'package:fithub/services/profile_service.dart';
import 'package:fithub/theme/app_theme.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:fithub/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import 'package:fithub/providers/locale_provider.dart';
import 'package:fithub/providers/currency_provider.dart';

// Mocks
class MockProfileService extends Mock implements ProfileService {}

class FakeUserProfile extends Fake implements UserProfile {}

class MockNavigatorObserver extends Mock implements NavigatorObserver {}

// Helper to get a consistent mock UserProfile
UserProfile getMockUserProfile({
  int? id = 1,
  String username = 'TestUser',
  String email = 'test@example.com',
  String? profilePictureUrl,
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
    id: id,
    username: username,
    email: email,
    profilePictureUrl: profilePictureUrl ?? 'assets/avatars/cat.png',
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
    when(() => mockProfileService.updateUserProfile(any())).thenAnswer(
      (_) async => sampleUserProfile,
    );
  });

  Future<void> pumpProfileSettingsScreen(
    WidgetTester tester,
    UserProfile userProfile,
  ) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => LocaleProvider()),
          ChangeNotifierProvider(create: (_) => CurrencyProvider()),
        ],
        child: MaterialApp(
          theme: AppTheme.lightTheme,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [
            Locale('en'),
            Locale('tr'),
          ],
          home: ProfileSettingsScreen(
            userProfile: userProfile,
            profileService: mockProfileService,
          ),
          routes: {
            '/login': (context) => const LoginScreen(),
          },
          navigatorObservers: [mockNavigatorObserver],
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  group('Delete Account Tests', () {
    testWidgets(
      'displays Delete Account button',
      (WidgetTester tester) async {
        await pumpProfileSettingsScreen(tester, sampleUserProfile);

        // Scroll to bottom to find Danger Zone
        await tester.drag(find.byType(ListView), const Offset(0, -10000));
        await tester.pumpAndSettle();

        expect(
          find.text('Delete Account'),
          findsAtLeastNWidgets(1),
        );
        expect(
          find.textContaining(
            'Your account will be deleted permanently.',
          ),
          findsOneWidget,
        );
      },
    );

    testWidgets(
      'shows confirmation dialog when Delete Account button is tapped',
      (WidgetTester tester) async {
        await pumpProfileSettingsScreen(tester, sampleUserProfile);

        // Scroll to Delete Account button
        await tester.drag(find.byType(ListView), const Offset(0, -10000));
        await tester.pumpAndSettle();

        // Find and tap Delete Account button
        final deleteButton = find.text('Delete Account').first;
        await tester.tap(deleteButton);
        await tester.pumpAndSettle();

        // Verify confirmation dialog appears
        expect(find.byType(AlertDialog), findsOneWidget);
        expect(find.text('Delete Account?'), findsOneWidget);
        expect(
          find.textContaining(
            'Are you sure you want to delete your account?',
          ),
          findsOneWidget,
        );
        expect(find.text('Cancel'), findsOneWidget);
      },
    );

    testWidgets(
      'closes dialog when Cancel is tapped without deleting account',
      (WidgetTester tester) async {
        await pumpProfileSettingsScreen(tester, sampleUserProfile);

        // Scroll and tap Delete Account button
        await tester.drag(find.byType(ListView), const Offset(0, -10000));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Delete Account').first);
        await tester.pumpAndSettle();

        // Tap Cancel in dialog
        await tester.tap(find.text('Cancel'));
        await tester.pumpAndSettle();

        // Verify dialog is closed
        expect(find.byType(AlertDialog), findsNothing);
        // Verify deleteAccount was never called
        verifyNever(() => mockProfileService.deleteAccount());
      },
    );

    testWidgets(
      'deletes account successfully and navigates to login screen',
      (WidgetTester tester) async {
        // Mock successful deletion
        when(() => mockProfileService.deleteAccount()).thenAnswer(
          (_) async {
            // Add a small delay to simulate API call
            await Future.delayed(const Duration(milliseconds: 100));
            return Future.value();
          },
        );

        await pumpProfileSettingsScreen(tester, sampleUserProfile);

        // Scroll and tap Delete Account button
        await tester.drag(find.byType(ListView), const Offset(0, -10000));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Delete Account').first);
        await tester.pumpAndSettle();

        // Confirm deletion in dialog
        await tester.tap(find.text('Delete Account').last); // Last one is in the dialog
        await tester.pump(); // Start async operation
        await tester.pump(const Duration(milliseconds: 150)); // Wait for mock delay
        await tester.pumpAndSettle(); // Complete all animations

        // Verify deleteAccount was called
        verify(() => mockProfileService.deleteAccount()).called(1);

        // Verify navigation to login screen
        expect(find.byType(LoginScreen), findsOneWidget);
      },
    );

    testWidgets(
      'shows error message when account deletion fails',
      (WidgetTester tester) async {
        // Mock failed deletion
        when(() => mockProfileService.deleteAccount()).thenThrow(
          ProfileServiceException('Failed to delete account', statusCode: 500),
        );

        await pumpProfileSettingsScreen(tester, sampleUserProfile);

        // Scroll and tap Delete Account button
        await tester.drag(find.byType(ListView), const Offset(0, -10000));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Delete Account').first);
        await tester.pumpAndSettle();

        // Confirm deletion in dialog
        await tester.tap(find.text('Delete Account').last); // Last one is in the dialog
        await tester.pump(); // Start the deletion process

        await tester.pumpAndSettle(); // Complete the error handling

        // Verify deleteAccount was called
        verify(() => mockProfileService.deleteAccount()).called(1);

        // Verify error message appears
        expect(
          find.textContaining('Failed to delete account'),
          findsOneWidget,
        );

        // Verify still on settings screen
        expect(find.byType(ProfileSettingsScreen), findsOneWidget);
        expect(find.byType(LoginScreen), findsNothing);
      },
    );

    testWidgets(
      'shows error when account not found (404)',
      (WidgetTester tester) async {
        // Mock 404 error
        when(() => mockProfileService.deleteAccount()).thenThrow(
          ProfileServiceException(
            'No RegisteredUser matches the given query.',
            statusCode: 404,
          ),
        );

        await pumpProfileSettingsScreen(tester, sampleUserProfile);

        // Scroll and tap Delete Account button
        await tester.drag(find.byType(ListView), const Offset(0, -10000));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Delete Account').first);
        await tester.pumpAndSettle();

        // Confirm deletion in dialog
        await tester.tap(find.text('Delete Account').last); // Last one is in the dialog
        await tester.pump(); // Start the deletion process

        await tester.pumpAndSettle(); // Complete the error handling

        // Verify error message appears
        expect(
          find.textContaining('No RegisteredUser matches the given query'),
          findsOneWidget,
        );

        // Verify still on settings screen
        expect(find.byType(ProfileSettingsScreen), findsOneWidget);
      },
    );
  });
}

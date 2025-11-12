import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/new_password_screen.dart';
import 'package:fithub/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import 'package:fithub/providers/locale_provider.dart';
import 'package:fithub/providers/currency_provider.dart';
import './mocks/mock_auth_service.dart';

void main() {
  late MockAuthService mockAuthService;

  setUp(() {
    mockAuthService = MockAuthService();
  });

  group('CreateNewPasswordPage Tests', () {
    testWidgets('CreateNewPasswordPage shows input fields and UI elements', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      // Access localizations for assertions
      final loc =
          AppLocalizations.of(
            tester.element(find.byType(CreateNewPasswordPage)),
          )!;

      // Verify app bar elements
      expect(find.text(loc.createNewPasswordTitle), findsOneWidget);

      // Verify input fields
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.text(loc.newPasswordLabel), findsOneWidget);
      expect(find.text(loc.confirmPasswordLabel), findsOneWidget);

      // Verify save button
      expect(find.text(loc.savePassword), findsOneWidget);

      // Verify button is enabled initially
      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNotNull);
    });

    testWidgets('Shows error for password shorter than 8 characters', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      final loc =
          AppLocalizations.of(
            tester.element(find.byType(CreateNewPasswordPage)),
          )!;

      // Enter short password
      await tester.enterText(
        find.byType(TextFormField).at(0),
        '1234567',
      ); // 7 chars
      await tester.enterText(find.byType(TextFormField).at(1), '1234567');

      await tester.tap(find.text(loc.savePassword));
      await tester.pump();

      expect(find.text(loc.passwordMinLength), findsOneWidget);
    });

    testWidgets('Shows error for empty password', (WidgetTester tester) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      final loc =
          AppLocalizations.of(
            tester.element(find.byType(CreateNewPasswordPage)),
          )!;

      // Leave password empty
      await tester.tap(find.text(loc.savePassword));
      await tester.pump();

      expect(find.text(loc.passwordRequired), findsOneWidget);
    });

    testWidgets('Shows error for mismatched passwords', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      final loc =
          AppLocalizations.of(
            tester.element(find.byType(CreateNewPasswordPage)),
          )!;

      // Enter mismatched passwords
      await tester.enterText(find.byType(TextFormField).at(0), 'Password123');
      await tester.enterText(find.byType(TextFormField).at(1), 'Password124');

      await tester.tap(find.text(loc.savePassword));
      await tester.pump();

      expect(find.text(loc.passwordsDoNotMatch), findsOneWidget);
    });

    testWidgets('Successful password reset shows success message', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test@example.com',
            authService: mockAuthService,
          ),
        ),
      );

      final loc =
          AppLocalizations.of(
            tester.element(find.byType(CreateNewPasswordPage)),
          )!;

      // Enter matching passwords (8+ chars for screen validation, 6+ for mock)
      await tester.enterText(find.byType(TextFormField).at(0), 'Password123');
      await tester.enterText(find.byType(TextFormField).at(1), 'Password123');

      await tester.tap(find.text(loc.savePassword));
      await tester.pump();

      // Verify loading indicator appears
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Wait for the async operation to complete (100ms delay in mock)
      await tester.pump(const Duration(milliseconds: 150));

      // Verify success message appears in snackbar
      expect(find.text(loc.passwordResetSuccessful), findsOneWidget);

      // Complete remaining animations
      await tester.pumpAndSettle();
    });

    testWidgets('Shows loading indicator during password reset', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      final loc =
          AppLocalizations.of(
            tester.element(find.byType(CreateNewPasswordPage)),
          )!;

      // Enter matching passwords
      await tester.enterText(find.byType(TextFormField).at(0), 'Password123');
      await tester.enterText(find.byType(TextFormField).at(1), 'Password123');

      await tester.tap(find.text(loc.savePassword));
      await tester.pump();

      // Verify loading indicator is shown
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Verify button is disabled during loading
      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNull);

      // Complete all pending async operations to avoid timer warnings
      await tester.pumpAndSettle();
    });

    testWidgets('Button is disabled while loading', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      final loc =
          AppLocalizations.of(
            tester.element(find.byType(CreateNewPasswordPage)),
          )!;

      // Initially button should be enabled
      ElevatedButton button = tester.widget<ElevatedButton>(
        find.byType(ElevatedButton),
      );
      expect(button.onPressed, isNotNull);

      // Enter valid passwords
      await tester.enterText(find.byType(TextFormField).at(0), 'Password123');
      await tester.enterText(find.byType(TextFormField).at(1), 'Password123');

      // Tap button
      await tester.tap(find.text(loc.savePassword));
      await tester.pump();

      // Button should now be disabled
      button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNull);

      // Complete all pending async operations to avoid timer warnings
      await tester.pumpAndSettle();
    });

    testWidgets('Screen has correct structure with Form', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      // Verify the screen has the correct structure
      expect(find.byType(Scaffold), findsOneWidget);
      expect(find.byType(AppBar), findsOneWidget);
      expect(find.byType(Form), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('Form submits and shows snackbar when valid', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      final loc =
          AppLocalizations.of(
            tester.element(find.byType(CreateNewPasswordPage)),
          )!;

      // Enter valid passwords
      await tester.enterText(find.byType(TextFormField).at(0), 'Password123');
      await tester.enterText(find.byType(TextFormField).at(1), 'Password123');

      await tester.tap(find.text(loc.savePassword));
      await tester.pump();

      // Verify loading indicator shows
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Let async operations complete
      await tester.pumpAndSettle();

      // Verify success snackbar shows
      expect(find.byType(SnackBar), findsOneWidget);
    });

    testWidgets('Language toggle is present in app bar', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      // Verify language toggle widget exists in app bar
      expect(find.byType(AppBar), findsOneWidget);
      // The LanguageToggle should be in the actions
      final appBar = tester.widget<AppBar>(find.byType(AppBar));
      expect(appBar.actions, isNotNull);
      expect(appBar.actions!.isNotEmpty, isTrue);
    });

    testWidgets('Form validates both fields before submission', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      final loc =
          AppLocalizations.of(
            tester.element(find.byType(CreateNewPasswordPage)),
          )!;

      // Enter short password in first field
      await tester.enterText(find.byType(TextFormField).at(0), 'short');
      await tester.enterText(find.byType(TextFormField).at(1), 'short');

      await tester.tap(find.text(loc.savePassword));
      await tester.pump(); // Trigger validation

      // The validator should prevent submission
      // Check that loading indicator doesn't appear (validation failed)
      expect(find.byType(CircularProgressIndicator), findsNothing);

      // Button should still be enabled (not loading)
      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNotNull);
    });

    testWidgets('Accepts exactly 8 character password', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      final loc =
          AppLocalizations.of(
            tester.element(find.byType(CreateNewPasswordPage)),
          )!;

      // Enter exactly 8 characters
      await tester.enterText(find.byType(TextFormField).at(0), '12345678');
      await tester.enterText(find.byType(TextFormField).at(1), '12345678');

      await tester.tap(find.text(loc.savePassword));
      await tester.pump();

      // Should not show length error
      expect(find.text(loc.passwordMinLength), findsNothing);

      // Should proceed with submission
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Complete all pending async operations to avoid timer warnings
      await tester.pumpAndSettle();
    });

    testWidgets('Disposes controllers properly', (WidgetTester tester) async {
      await tester.pumpWidget(
        _buildApp(
          CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      // Widget should be present
      expect(find.byType(CreateNewPasswordPage), findsOneWidget);

      // Remove widget
      await tester.pumpWidget(_buildApp(Container()));

      // Should not throw any errors during disposal
      expect(find.byType(CreateNewPasswordPage), findsNothing);
    });
  });
}

/// Helper method to build app with proper localization and providers
Widget _buildApp(Widget home) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider(create: (_) => LocaleProvider()),
      ChangeNotifierProvider(create: (_) => CurrencyProvider()),
    ],
    child: MaterialApp(
      home: home,
      locale: const Locale('en'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    ),
  );
}

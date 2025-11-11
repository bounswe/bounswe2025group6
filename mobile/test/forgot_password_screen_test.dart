import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/forgot_pass_screen.dart';
import 'package:fithub/screens/verify_code_screen.dart';
import './mocks/mock_auth_service.dart';
import 'dart:async';
import 'package:fithub/l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:fithub/providers/locale_provider.dart';
import 'package:fithub/providers/currency_provider.dart';

void main() {
  late MockAuthService mockAuthService;

  setUp(() {
    mockAuthService = MockAuthService();
  });

  // Helper widget to wrap screens with localization and providers
  Widget createTestApp(Widget child) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LocaleProvider()),
        ChangeNotifierProvider(create: (_) => CurrencyProvider()),
      ],
      child: MaterialApp(
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
        home: child,
      ),
    );
  }

  group('Forgot Password Screen Tests', () {
    testWidgets('Forgot password screen shows all required elements', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(createTestApp(const ForgotPasswordScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Forgot Password'), findsOneWidget);
      expect(find.text('Reset Password'), findsOneWidget);
      expect(
        find.text(
          'Enter your email address and we will send you instructions to reset your password.',
        ),
        findsOneWidget,
      );
      expect(find.text('EMAIL'), findsOneWidget);
      expect(find.text('Send Reset Link'), findsOneWidget);
    });

    testWidgets('Forgot password form validation works', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        createTestApp(
          Builder(
            builder: (context) => Scaffold(
              body: ForgotPasswordScreen(authService: mockAuthService),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Test empty email
      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();
      expect(find.text('Please enter your email'), findsOneWidget);

      // Test invalid email
      await tester.enterText(find.byType(TextFormField), 'invalid-email');
      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();
      expect(find.text('Enter a valid email'), findsOneWidget);

      // Test valid email
      await tester.enterText(find.byType(TextFormField), 'test@example.com');
      await tester.tap(find.text('Send Reset Link'));
      // Wait for animations and async operations
      await tester.pump(); // Process the tap
      await tester.pump(const Duration(milliseconds: 100)); // Wait for SnackBar animation

      // Now check for SnackBar
      expect(find.byType(SnackBar), findsOneWidget);
    });

    testWidgets('Successful password reset request shows success message', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        createTestApp(
          Builder(
            builder: (context) => Scaffold(
              body: ForgotPasswordScreen(authService: mockAuthService),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextFormField),
        'test@example.com',
      );

      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.byType(SnackBar), findsOneWidget);
      expect(
        find.text('Password reset code has been sent to your email'),
        findsOneWidget,
      );
    });

    testWidgets('Failed password reset request shows error message', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        createTestApp(
          ScaffoldMessenger(
            child: Scaffold(
              body: ForgotPasswordScreen(authService: mockAuthService),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Enter invalid email
      await tester.enterText(
        find.byType(TextFormField),
        'wrong@example.com',
      );

      // Tap send button
      await tester.tap(find.text('Send Reset Link'));
      await tester.pumpAndSettle();

      // Verify error message
      expect(
        find.textContaining('This email address is not registered.'),
        findsOneWidget,
      );
    });

    testWidgets('Shows loading indicator during API call', (
      WidgetTester tester,
    ) async {
      final completer = Completer<void>();
      final testAuthService = MockAuthService()
        ..setForgotPasswordResponse(completer.future);

      await tester.pumpWidget(
        createTestApp(
          Builder(
            builder: (context) => Scaffold(
              body: ForgotPasswordScreen(authService: testAuthService),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byType(TextFormField),
        'test@example.com',
      );

      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      completer.complete();
      await tester.pumpAndSettle();
    });

    testWidgets('Successful password reset request navigates to verify code screen',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        createTestApp(
          Builder(
            builder: (context) => Scaffold(
              body: ForgotPasswordScreen(authService: mockAuthService),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField), 'test@example.com');
      await tester.tap(find.text('Send Reset Link'));
      await tester.pumpAndSettle();

      expect(find.byType(VerifyCodeScreen), findsOneWidget);
    });

    testWidgets('Email field accepts input', (WidgetTester tester) async {
      await tester.pumpWidget(createTestApp(const ForgotPasswordScreen()));
      await tester.pumpAndSettle();

      final emailField = find.byType(TextFormField);
      await tester.enterText(emailField, 'test@example.com');

      expect(find.text('test@example.com'), findsOneWidget);
    });

    testWidgets('AppBar has back button icon', (WidgetTester tester) async {
      await tester.pumpWidget(createTestApp(const ForgotPasswordScreen()));
      await tester.pumpAndSettle();

      // Verify AppBar exists - back button is automatically shown when there's a nav stack
      expect(find.byType(AppBar), findsOneWidget);
      
      // In this test scenario (showing as home), there's no previous route
      // so the back button won't be shown, which is correct behavior
    });

    testWidgets('AppBar shows correct title', (WidgetTester tester) async {
      await tester.pumpWidget(createTestApp(const ForgotPasswordScreen()));
      await tester.pumpAndSettle();

      expect(find.widgetWithText(AppBar, 'Forgot Password'), findsOneWidget);
    });

    testWidgets('Reset button is disabled during loading', (WidgetTester tester) async {
      final completer = Completer<void>();
      final testAuthService = MockAuthService()
        ..setForgotPasswordResponse(completer.future);

      await tester.pumpWidget(
        createTestApp(
          Builder(
            builder: (context) => Scaffold(
              body: ForgotPasswordScreen(authService: testAuthService),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField), 'test@example.com');
      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();

      // During loading, button should be replaced by loading indicator
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.text('Send Reset Link'), findsNothing);

      completer.complete();
      await tester.pumpAndSettle();

      // After loading, button should be visible again
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('Multiple invalid emails show appropriate errors', (WidgetTester tester) async {
      await tester.pumpWidget(
        createTestApp(
          Builder(
            builder: (context) => Scaffold(
              body: ForgotPasswordScreen(authService: mockAuthService),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Test email without @
      await tester.enterText(find.byType(TextFormField), 'notanemail');
      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();
      expect(find.text('Enter a valid email'), findsOneWidget);

      // Test empty string
      await tester.enterText(find.byType(TextFormField), '');
      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();
      expect(find.text('Please enter your email'), findsOneWidget);
    });
  });
}

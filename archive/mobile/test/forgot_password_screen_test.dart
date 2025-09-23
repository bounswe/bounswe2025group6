import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/forgot_pass_screen.dart';
import 'package:fithub/screens/verify_code_screen.dart';
import './mocks/mock_auth_service.dart';
import 'dart:async';

void main() {
  late MockAuthService mockAuthService;

  setUp(() {
    mockAuthService = MockAuthService();
  });

  group('Forgot Password Screen Tests', () {
    testWidgets('Forgot password screen shows all required elements', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: ForgotPasswordScreen()));

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
      await tester.pumpWidget(MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: ForgotPasswordScreen(authService: mockAuthService),
          ),
        ),
      ));

      // Test empty email
      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();
      expect(find.text('Please enter your email'), findsOneWidget);

      // Test invalid email
      await tester.enterText(find.byType(TextFormField), 'invalid-email');
      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();
      expect(find.text('Please enter a valid email'), findsOneWidget);

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
      await tester.pumpWidget(MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: ForgotPasswordScreen(authService: mockAuthService),
          ),
        ),
      ));

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
      await tester.pumpWidget(MaterialApp(
        home: ScaffoldMessenger(
          child: Scaffold(
            body: ForgotPasswordScreen(authService: mockAuthService),
          ),
        ),
      ));

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
        find.text('This email address is not registered.'),
        findsOneWidget,
      );
    });

    testWidgets('Shows loading indicator during API call', (
      WidgetTester tester,
    ) async {
      final completer = Completer<void>();
      final testAuthService = MockAuthService()
        ..setForgotPasswordResponse(completer.future);

      await tester.pumpWidget(MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: ForgotPasswordScreen(authService: testAuthService),
          ),
        ),
      ));

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
      await tester.pumpWidget(MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: ForgotPasswordScreen(authService: mockAuthService),
          ),
        ),
      ));

      await tester.enterText(find.byType(TextFormField), 'test@example.com');
      await tester.tap(find.text('Send Reset Link'));
      await tester.pumpAndSettle();

      expect(find.byType(VerifyCodeScreen), findsOneWidget);
    });
  });
}

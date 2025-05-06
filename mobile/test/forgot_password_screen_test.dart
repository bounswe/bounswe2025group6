import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/forgot_pass_screen.dart';
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
        home: ScaffoldMessenger(
          child: Scaffold(
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
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500)); // Wait for API call
      await tester.pump(); // Process response

      expect(
        find.text('Password reset link sent to your email'),
        findsOneWidget,
      );
    });

    testWidgets('Successful password reset request shows success message', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(MaterialApp(
        home: ScaffoldMessenger(
          child: Scaffold(
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
      await tester.pump(const Duration(milliseconds: 500)); // Wait for API call
      await tester.pump(); // Process response

      expect(
        find.text('Password reset link sent to your email'),
        findsOneWidget,
      );
    });

    testWidgets('Failed password reset request shows error message', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: ForgotPasswordScreen()));

      // Enter invalid email
      await tester.enterText(
        find.byType(TextFormField),
        'wrong@example.com',
      );

      // Tap send button
      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));

      // Verify error message
      expect(
        find.text('Invalid email address.'),
        findsOneWidget,
      );
    });

    testWidgets('Shows loading indicator during API call', (
      WidgetTester tester,
    ) async {
      // Create a completer to control the API call timing
      final completer = Completer<void>();
      
      // Override the mock service for this specific test
      final testAuthService = MockAuthService()
        ..setForgotPasswordResponse(completer.future);

      await tester.pumpWidget(MaterialApp(
        home: ScaffoldMessenger(
          child: Scaffold(
            body: ForgotPasswordScreen(authService: testAuthService),
          ),
        ),
      ));

      await tester.enterText(
        find.byType(TextFormField),
        'test@example.com',
      );

      // Trigger the forgot password action
      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();

      // Verify loading indicator is shown
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Complete the API call
      completer.complete();
      await tester.pumpAndSettle();
    });
  });
}

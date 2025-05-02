import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/login_screen.dart';
import 'package:fithub/screens/forgot_pass_screen.dart';
import 'package:fithub/theme/app_theme.dart';

void main() {
  group('Login Screen Tests', () {
    testWidgets('Login screen shows all required elements', (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(home: LoginScreen()));

      // Verify all important widgets are present
      expect(find.text('Login'), findsOneWidget);
      expect(find.text('Sign in to continue'), findsOneWidget);
      expect(find.text('EMAIL'), findsOneWidget);
      expect(find.text('PASSWORD'), findsOneWidget);
      expect(find.text('Log In'), findsOneWidget);
      expect(find.text('Forgot Password?'), findsOneWidget);
      expect(find.text("Don't have an account? "), findsOneWidget);
      expect(find.text('Create Account'), findsOneWidget);
    });

    testWidgets('Login form validation works', (WidgetTester tester) async {
      // Pump the LoginScreen widget
      await tester.pumpWidget(const MaterialApp(home: LoginScreen()));
      await tester.pumpAndSettle();

      // Ensure the widget is scrolled into view before tapping
      await tester.ensureVisible(find.text('Log In'));
      await tester.pumpAndSettle();

      // Try to login without entering any data
      await tester.tap(find.text('Log In'));
      await tester.pump();

      // Verify validation messages appear
      expect(find.text('Please enter your email'), findsOneWidget);
      expect(find.text('Please enter your password'), findsOneWidget);

      // Enter invalid email and ensure it's visible
      final emailField = find.byType(TextFormField).first;
      await tester.ensureVisible(emailField);
      await tester.enterText(emailField, 'invalid-email');
      
      // Ensure button is visible before tapping
      await tester.ensureVisible(find.text('Log In'));
      await tester.tap(find.text('Log In'));
      await tester.pump();

      // Verify email validation message matches exactly what's in LoginScreen
      expect(find.text('Please enter a valid email'), findsOneWidget);
    });

    testWidgets('Navigation to Forgot Password works', (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(home: LoginScreen()));

      // Tap forgot password link
      await tester.tap(find.text('Forgot Password?'));
      await tester.pumpAndSettle();

      // Verify navigation to forgot password screen
      expect(find.byType(ForgotPasswordScreen), findsOneWidget);
    });
  });

  group('Forgot Password Screen Tests', () {
    testWidgets('Forgot password screen shows all required elements', (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(home: ForgotPasswordScreen()));

      // Verify all important widgets are present
      expect(find.text('Forgot Password'), findsOneWidget);
      expect(find.text('Reset Password'), findsOneWidget);
      expect(find.text('Enter your email address and we will send you instructions to reset your password.'), findsOneWidget);
      expect(find.text('EMAIL'), findsOneWidget);
      expect(find.text('Send Reset Link'), findsOneWidget);
    });

    testWidgets('Forgot password form validation works', (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(home: ForgotPasswordScreen()));

      // Try to submit without entering email
      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();

      // Verify validation message appears
      expect(find.text('Please enter your email'), findsOneWidget);

      // Enter invalid email
      await tester.enterText(find.byType(TextFormField), 'invalid-email');
      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();

      // Verify email validation message
      expect(find.text('Please enter a valid email'), findsOneWidget);

      // Enter valid email
      await tester.enterText(find.byType(TextFormField), 'test@example.com');
      await tester.tap(find.text('Send Reset Link'));
      await tester.pump();

      // Verify success message
      expect(find.text('Password reset link sent to your email'), findsOneWidget);
    });
  });
}

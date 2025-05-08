import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/login_screen.dart';
import 'package:fithub/screens/forgot_pass_screen.dart';
import './mocks/mock_auth_service.dart';
import 'dart:async';
import 'package:fithub/models/login_response.dart';
import 'package:fithub/services/auth_service.dart';
import 'package:fithub/screens/dashboard_screen.dart';

void main() {
  late MockAuthService mockAuthService;

  setUp(() {
    mockAuthService = MockAuthService();
  });

  group('Login Screen Tests', () {
    testWidgets('Login screen shows all required elements', (
      WidgetTester tester,
    ) async {
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
      await tester.pumpWidget(const MaterialApp(home: LoginScreen()));
      await tester.pumpAndSettle();

      await tester.ensureVisible(find.text('Log In'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Log In'));
      await tester.pump();

      expect(find.text('Please enter your email'), findsOneWidget);
      expect(find.text('Please enter your password'), findsOneWidget);

      final emailField = find.byType(TextFormField).first;
      await tester.ensureVisible(emailField);
      await tester.enterText(emailField, 'invalid-email');

      await tester.ensureVisible(find.text('Log In'));
      await tester.tap(find.text('Log In'));
      await tester.pump();

      expect(find.text('Please enter a valid email'), findsOneWidget);
    });

    testWidgets('Navigation to Forgot Password works', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: LoginScreen()));

      await tester.tap(find.text('Forgot Password?'));
      await tester.pumpAndSettle();

      expect(find.byType(ForgotPasswordScreen), findsOneWidget);
    });

    testWidgets('Successful login shows success message', (
      WidgetTester tester,
    ) async {
      final loginCompleter = Completer<LoginResponse>();
      mockAuthService.setLoginResponse(loginCompleter);

      await tester.pumpWidget(MaterialApp(
        home: ScaffoldMessenger(
          child: LoginScreen(authService: mockAuthService),
        ),
      ));

      // Enter valid credentials
      await tester.enterText(
        find.byType(TextFormField).first,
        'test@example.com',
      );
      await tester.enterText(
        find.byType(TextFormField).last,
        'password123',
      );

      // Tap login button
      await tester.tap(find.text('Log In'));
      await tester.pump();

      // Verify loading state
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Complete the API call
      loginCompleter.complete(LoginResponse(
        email: 'test@example.com',
        token: 'mock_token',
      ));

      // Wait for all frame processing
      for (var i = 0; i < 10; i++) {
        await tester.pump(const Duration(milliseconds: 50));
      }

      // Verify SnackBar and its content
      expect(find.byType(SnackBar), findsOneWidget);
      expect(
        find.text('Login successful!'),
        findsOneWidget,
      );
    });

    testWidgets('Failed login shows error message', (
      WidgetTester tester,
    ) async {
      final loginCompleter = Completer<LoginResponse>();
      mockAuthService.setLoginResponse(loginCompleter);

      await tester.pumpWidget(MaterialApp(
        home: ScaffoldMessenger(
          child: LoginScreen(authService: mockAuthService),
        ),
      ));

      // Enter invalid credentials
      await tester.enterText(
        find.byType(TextFormField).first,
        'wrong@example.com',
      );
      await tester.enterText(
        find.byType(TextFormField).last,
        'wrongpassword',
      );

      // Tap login button
      await tester.tap(find.text('Log In'));
      await tester.pump();

      // Complete with error
      loginCompleter.completeError(AuthenticationException('Invalid credentials'));

      // Wait for all frame processing
      for (var i = 0; i < 10; i++) {
        await tester.pump(const Duration(milliseconds: 50));
      }

      // Verify error message
      expect(find.byType(SnackBar), findsOneWidget);
      expect(
        find.text('Login failed: Invalid credentials'),
        findsOneWidget,
      );
    });

    testWidgets('Successful login navigates to dashboard', (WidgetTester tester) async {
      final loginCompleter = Completer<LoginResponse>();
      mockAuthService.setLoginResponse(loginCompleter);

      await tester.pumpWidget(MaterialApp(
        home: LoginScreen(authService: mockAuthService),
      ));

      // Enter valid credentials
      await tester.enterText(
        find.byType(TextFormField).first,
        'test@example.com',
      );
      await tester.enterText(
        find.byType(TextFormField).last,
        'password123',
      );

      // Tap login button
      await tester.tap(find.text('Log In'));
      await tester.pump();

      // Complete the API call
      loginCompleter.complete(LoginResponse(
        email: 'test@example.com',
        token: 'mock_token',
      ));

      // Wait for navigation
      await tester.pumpAndSettle();

      // Verify navigation to dashboard
      expect(find.byType(DashboardScreen), findsOneWidget);
      expect(find.text('Welcome back!'), findsOneWidget);
    });
  });
}

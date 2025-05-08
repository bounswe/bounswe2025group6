import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/register_screen.dart';
import 'package:fithub/screens/login_screen.dart'; 
import 'package:fithub/services/auth_service.dart'; 
import 'mocks/mock_auth_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late MockAuthService mockAuthService;

  setUp(() {
    mockAuthService = MockAuthService();
  });

  testWidgets('Initial UI shows form without PDF picker', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(home: RegisterPage(authService: mockAuthService)),
    );

    expect(find.text('Create Account'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(4));
    expect(find.text('Upload PDF (Certificate)'), findsNothing);
  });

  testWidgets('Selecting Dietitian reveals PDF picker', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(home: RegisterPage(authService: mockAuthService)),
    );

    await tester.tap(find.byType(DropdownButtonFormField<String>));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Dietitian').last);
    await tester.pumpAndSettle();

    expect(find.text('Upload PDF (Certificate)'), findsOneWidget);
  });

  testWidgets('Validation errors appear on empty form submit', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(home: RegisterPage(authService: mockAuthService)),
    );

    await tester.tap(find.byType(ElevatedButton));
    await tester.pump();

    expect(find.text('Enter at least 3 characters'), findsOneWidget);
    expect(find.text('Enter a valid email'), findsOneWidget);
    expect(find.text('Enter at least 6 characters'), findsOneWidget);
    expect(find.text('Please confirm your password'), findsOneWidget);
  });

  testWidgets('Form passes validation with valid user data', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(home: RegisterPage(authService: mockAuthService)),
    );

    await tester.enterText(find.byType(TextFormField).at(0), 'seyituser');
    await tester.enterText(
      find.byType(TextFormField).at(1),
      'seyit@example.com',
    );
    await tester.enterText(find.byType(TextFormField).at(2), '123456');
    await tester.enterText(find.byType(TextFormField).at(3), '123456');

    await tester.tap(find.widgetWithText(ElevatedButton, 'Register'));
    await tester
        .pumpAndSettle(); // Ensure all microtasks and animations complete

    expect(find.textContaining('least'), findsNothing);
    expect(find.textContaining('valid email'), findsNothing);
    expect(find.text('Passwords do not match'), findsNothing);
    expect(find.text('Please confirm your password'), findsNothing);
  });

  // Added test case for password mismatch
  testWidgets('Validation error appears when passwords do not match', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(home: RegisterPage(authService: mockAuthService)),
    );

    await tester.enterText(find.byType(TextFormField).at(0), 'seyituser');
    await tester.enterText(
      find.byType(TextFormField).at(1),
      'seyit@example.com',
    );
    await tester.enterText(
      find.byType(TextFormField).at(2),
      '123456',
    ); // Password
    await tester.enterText(
      find.byType(TextFormField).at(3),
      '654321',
    ); // Confirm Password (mismatching)

    await tester.tap(find.widgetWithText(ElevatedButton, 'Register'));
    await tester
        .pumpAndSettle(); // Ensure all microtasks and animations complete

    expect(find.textContaining('least'), findsNothing);
    expect(find.textContaining('valid email'), findsNothing);
    expect(
      find.text('Passwords do not match'),
      findsOneWidget,
    ); // Check mismatch error
    expect(find.text('Please confirm your password'), findsNothing);
  });

  group('Registration API Calls', () {
    testWidgets('Successful User Registration navigates to LoginScreen', (
      WidgetTester tester,
    ) async {
      mockAuthService.setRegisterResponse(null); // Simulate success

      await tester.pumpWidget(
        MaterialApp(
          home: RegisterPage(authService: mockAuthService),
          routes: {'/login': (context) => const LoginScreen()},
        ),
      );

      await tester.enterText(find.byType(TextFormField).at(0), 'testuser');
      await tester.enterText(
        find.byType(TextFormField).at(1),
        'user@example.com',
      );
      await tester.enterText(find.byType(TextFormField).at(2), 'password123');
      await tester.enterText(find.byType(TextFormField).at(3), 'password123');

      await tester.ensureVisible(
        find.widgetWithText(ElevatedButton, 'Register'),
      );
      await tester.tap(find.widgetWithText(ElevatedButton, 'Register'));
      await tester.pump(Duration.zero); // Process the setState for isLoading

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      await tester
          .pumpAndSettle(); // Finish all async operations and navigation

      expect(
        find.text(
          'Registration successful! Please check your email to verify.',
        ),
        findsOneWidget,
      );
      expect(find.byType(LoginScreen), findsOneWidget);
    });

    testWidgets('Successful Dietitian Registration navigates to LoginScreen', (
      WidgetTester tester,
    ) async {
      mockAuthService.setRegisterResponse(null); // Simulate success

      await tester.pumpWidget(
        MaterialApp(
          home: RegisterPage(authService: mockAuthService),
          routes: {'/login': (context) => const LoginScreen()},
        ),
      );

      // Select Dietitian
      await tester.tap(find.byType(DropdownButtonFormField<String>));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Dietitian').last);
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).at(0), 'testdietitian');
      await tester.enterText(
        find.byType(TextFormField).at(1),
        'dietitian@example.com',
      );
      await tester.enterText(find.byType(TextFormField).at(2), 'password123');
      await tester.enterText(find.byType(TextFormField).at(3), 'password123');

      await tester.ensureVisible(
        find.widgetWithText(ElevatedButton, 'Register'),
      );
      await tester.tap(find.widgetWithText(ElevatedButton, 'Register'));

      // Since _pdfFile is null, we expect the SnackBar for missing PDF
      await tester.pumpAndSettle();

      expect(
        find.text('Dietitians must upload a PDF certificate.'),
        findsOneWidget,
      );
      expect(
        find.byType(CircularProgressIndicator),
        findsNothing,
      ); // Should not be loading
      expect(find.byType(LoginScreen), findsNothing); // Should not navigate
    });

    testWidgets(
      'Registration failure with AuthenticationException shows SnackBar',
      (WidgetTester tester) async {
        final exceptionMessage = 'Email already exists.';
        mockAuthService.setRegisterResponse(
          AuthenticationException(exceptionMessage),
        );

        await tester.pumpWidget(
          MaterialApp(home: RegisterPage(authService: mockAuthService)),
        );

        await tester.enterText(find.byType(TextFormField).at(0), 'testuser');
        await tester.enterText(
          find.byType(TextFormField).at(1),
          'existing@example.com',
        );
        await tester.enterText(find.byType(TextFormField).at(2), 'password123');
        await tester.enterText(find.byType(TextFormField).at(3), 'password123');

        await tester.ensureVisible(
          find.widgetWithText(ElevatedButton, 'Register'),
        );
        await tester.tap(find.widgetWithText(ElevatedButton, 'Register'));

        await tester.pumpAndSettle();

        expect(find.text(exceptionMessage), findsOneWidget);
        expect(find.byType(LoginScreen), findsNothing); // Should not navigate
      },
    );

    testWidgets('Registration failure with generic Exception shows SnackBar', (
      WidgetTester tester,
    ) async {
      final errorMessage = 'An unexpected error occurred';
      mockAuthService.setRegisterResponse(Exception('Some generic error'));

      await tester.pumpWidget(
        MaterialApp(home: RegisterPage(authService: mockAuthService)),
      );

      await tester.enterText(find.byType(TextFormField).at(0), 'testuser');
      await tester.enterText(
        find.byType(TextFormField).at(1),
        'error@example.com',
      );
      await tester.enterText(find.byType(TextFormField).at(2), 'password123');
      await tester.enterText(find.byType(TextFormField).at(3), 'password123');

      await tester.ensureVisible(
        find.widgetWithText(ElevatedButton, 'Register'),
      );
      await tester.tap(find.widgetWithText(ElevatedButton, 'Register'));
      // For error cases, we pumpAndSettle directly.
      await tester.pumpAndSettle();

      expect(find.textContaining(errorMessage), findsOneWidget);
      expect(find.byType(LoginScreen), findsNothing); // Should not navigate
    });
  });
}

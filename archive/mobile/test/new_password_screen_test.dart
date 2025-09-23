import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/new_password_screen.dart';
import './mocks/mock_auth_service.dart';

void main() {
  late MockAuthService mockAuthService;

  setUp(() {
    mockAuthService = MockAuthService();
  });

  group('CreateNewPasswordPage Tests', () {
    testWidgets('CreateNewPasswordPage shows input fields', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.text('New Password'), findsOneWidget);
      expect(find.text('Confirm Password'), findsOneWidget);
      expect(find.text('Save Password'), findsOneWidget);
    });

    testWidgets('Shows error for password shorter than 8 characters', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      await tester.enterText(find.byType(TextFormField).at(0), '1234567'); // 7 chars
      await tester.enterText(find.byType(TextFormField).at(1), '1234567');

      await tester.tap(find.text('Save Password'));
      await tester.pump();

      expect(find.text('Password must be at least 8 characters'), findsOneWidget);
    });

    testWidgets('Shows error for mismatched passwords', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      await tester.enterText(find.byType(TextFormField).at(0), 'Password123'); // Valid password
      await tester.enterText(find.byType(TextFormField).at(1), 'Password124'); // Different password

      await tester.tap(find.text('Save Password'));
      await tester.pump();

      expect(find.text('Passwords do not match'), findsOneWidget);
    });

    testWidgets('Successful password reset shows success message and navigates', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      await tester.enterText(find.byType(TextFormField).at(0), 'Password123');
      await tester.enterText(find.byType(TextFormField).at(1), 'Password123');

      await tester.tap(find.text('Save Password'));
      await tester.pump();

      // Verify loading indicator appears
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Let the mock complete
      await tester.pumpAndSettle();

      // Verify success message
      expect(find.text('Password reset successful'), findsOneWidget);
    });

    testWidgets('Shows loading indicator during password reset', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: CreateNewPasswordPage(
            email: 'test@example.com',
            token: 'test-token',
            authService: mockAuthService,
          ),
        ),
      );

      await tester.enterText(find.byType(TextFormField).at(0), 'Password123');
      await tester.enterText(find.byType(TextFormField).at(1), 'Password123');

      await tester.tap(find.text('Save Password'));
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });
}

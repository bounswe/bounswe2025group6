import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/new_password_screen.dart';
import './mocks/mock_auth_service.dart';

void main() {
  late MockAuthService mockAuthService;

  setUp(() {
    mockAuthService = MockAuthService();
  });

  testWidgets('CreateNewPasswordPage shows input fields', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: CreateNewPasswordPage(
          email: 'test@example.com',
          authService: mockAuthService,
        ),
      ),
    );

    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.text('New Password'), findsOneWidget);
    expect(find.text('Confirm Password'), findsOneWidget);
    expect(find.text('Save Password'), findsOneWidget);
  });

  testWidgets('Shows error if passwords are too short or mismatched', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: CreateNewPasswordPage(
          email: 'test@example.com',
          authService: mockAuthService,
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField).at(0), '123');
    await tester.enterText(find.byType(TextFormField).at(1), '456');

    await tester.tap(find.text('Save Password'));
    await tester.pump();

    expect(find.text('Enter at least 6 characters'), findsOneWidget);
    expect(find.text('Passwords do not match'), findsOneWidget);
  });

  testWidgets('Accepts valid matching passwords', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: CreateNewPasswordPage(
          email: 'test@example.com',
          authService: mockAuthService,
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField).at(0), 'abc123');
    await tester.enterText(find.byType(TextFormField).at(1), 'abc123');

    await tester.tap(find.text('Save Password'));
    await tester.pump();

    expect(find.textContaining('characters'), findsNothing);
    expect(find.textContaining('match'), findsNothing);
  });
}

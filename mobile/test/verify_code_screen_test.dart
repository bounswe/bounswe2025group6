import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/verify_code_screen.dart';
import './mocks/mock_auth_service.dart';
import 'package:fithub/screens/new_password_screen.dart';

void main() {
  late MockAuthService mockAuthService;

  setUp(() {
    mockAuthService = MockAuthService();
  });

  testWidgets('VerifyCodeScreen shows UI elements', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: VerifyCodeScreen(
          email: 'test@example.com',
          authService: mockAuthService,
        ),
      ),
    );

    expect(find.textContaining('test@example.com'), findsOneWidget);
    expect(find.byType(TextFormField), findsOneWidget);
    // Use byType to find the button specifically
    expect(find.byType(ElevatedButton), findsOneWidget);
  });

  testWidgets('Shows error for invalid code', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: VerifyCodeScreen(
          email: 'test@example.com',
          authService: mockAuthService,
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField), '123457');
    // Use byType to find the button
    await tester.tap(find.byType(ElevatedButton));
    await tester.pumpAndSettle();

    expect(find.text('Invalid reset code.'), findsOneWidget);
  });

  testWidgets('Navigates to new password screen on success',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: VerifyCodeScreen(
          email: 'test@example.com',
          authService: mockAuthService,
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField), '123456');
    // Use byType to find the button
    await tester.tap(find.byType(ElevatedButton));
    await tester.pumpAndSettle();

    expect(find.byType(CreateNewPasswordPage), findsOneWidget);
  });
}

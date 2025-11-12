import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:fithub/screens/verify_code_screen.dart';
import 'package:fithub/l10n/app_localizations.dart';
import 'package:fithub/providers/locale_provider.dart';
import './mocks/mock_auth_service.dart';
import 'package:fithub/screens/new_password_screen.dart';

void main() {
  late MockAuthService mockAuthService;

  setUp(() {
    mockAuthService = MockAuthService();
  });

  Widget createTestApp(Widget child) {
    return ChangeNotifierProvider(
      create: (_) => LocaleProvider(),
      child: MaterialApp(
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [
          Locale('en', ''),
          Locale('tr', ''),
        ],
        home: child,
      ),
    );
  }

  testWidgets('VerifyCodeScreen shows UI elements', (WidgetTester tester) async {
    await tester.pumpWidget(
      createTestApp(
        VerifyCodeScreen(
          email: 'test@example.com',
          authService: mockAuthService,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('test@example.com'), findsOneWidget);
    expect(find.byType(TextFormField), findsOneWidget);
    expect(find.byType(ElevatedButton), findsOneWidget);
  });

  testWidgets('Shows validation error for empty code', (WidgetTester tester) async {
    await tester.pumpWidget(
      createTestApp(
        VerifyCodeScreen(
          email: 'test@example.com',
          authService: mockAuthService,
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byType(ElevatedButton));
    await tester.pump();

    expect(find.text('Please enter the reset code'), findsOneWidget);
  });

  testWidgets('Shows error for invalid code', (WidgetTester tester) async {
    await tester.pumpWidget(
      createTestApp(
        VerifyCodeScreen(
          email: 'test@example.com',
          authService: mockAuthService,
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField), '123457');
    await tester.tap(find.byType(ElevatedButton));
    await tester.pumpAndSettle();

    expect(find.textContaining('Invalid reset code'), findsOneWidget);
  });

  testWidgets('Navigates to new password screen on success',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      createTestApp(
        VerifyCodeScreen(
          email: 'test@example.com',
          authService: mockAuthService,
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField), '123456');
    await tester.tap(find.byType(ElevatedButton));
    await tester.pumpAndSettle();

    expect(find.byType(CreateNewPasswordPage), findsOneWidget);
    expect(find.text('Code verified successfully'), findsOneWidget);
  });
}


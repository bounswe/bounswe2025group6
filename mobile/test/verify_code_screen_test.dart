import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/verify_code_screen.dart';

void main() {
  testWidgets('VerifyCodeScreen shows UI elements', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: VerifyCodeScreen(email: 'test@example.com'),
      ),
    );

    expect(find.textContaining('test@example.com'), findsOneWidget);
    expect(find.byType(TextFormField), findsOneWidget);
    expect(find.text('Doğrula'), findsOneWidget);
  });

  testWidgets('Shows error if less than 6 digits entered', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: VerifyCodeScreen(email: 'test@example.com'),
      ),
    );

    await tester.enterText(find.byType(TextFormField), '123');
    await tester.tap(find.text('Doğrula'));
    await tester.pump();

    expect(find.text('6 haneli kod girin'), findsOneWidget);
  });

  testWidgets('Accepts 6-digit correct code', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: VerifyCodeScreen(email: 'test@example.com'),
      ),
    );

    await tester.enterText(find.byType(TextFormField), '123456');
    await tester.tap(find.text('Doğrula'));

    await tester.pumpAndSettle();

    // Yeni sayfa açıldığında eski başlık görünmemeli
    expect(find.text('Kodu Doğrula'), findsNothing);
  });
}

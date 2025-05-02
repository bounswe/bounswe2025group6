import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/new_password_screen.dart';

void main() {
  testWidgets('CreateNewPasswordPage shows input fields', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: CreateNewPasswordPage()));

    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.text('Yeni Şifre'), findsOneWidget);
    expect(find.text('Şifreyi Tekrar Yaz'), findsOneWidget);
    expect(find.text('Şifreyi Kaydet'), findsOneWidget);
  });

  testWidgets('Shows error if passwords are too short or mismatched', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: CreateNewPasswordPage()));

    await tester.enterText(find.byType(TextFormField).at(0), '123');
    await tester.enterText(find.byType(TextFormField).at(1), '456');

    await tester.tap(find.text('Şifreyi Kaydet'));
    await tester.pump();

    expect(find.text('En az 6 karakter girin'), findsOneWidget);
    expect(find.text('Şifreler eşleşmiyor'), findsOneWidget);
  });

  testWidgets('Accepts valid matching passwords', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: CreateNewPasswordPage()));

    await tester.enterText(find.byType(TextFormField).at(0), 'abc123');
    await tester.enterText(find.byType(TextFormField).at(1), 'abc123');

    await tester.tap(find.text('Şifreyi Kaydet'));
    await tester.pump();

    // Eğer validator’dan geçtiyse hata mesajı olmamalı
    expect(find.textContaining('karakter'), findsNothing);
    expect(find.textContaining('eşleşmiyor'), findsNothing);
  });
}

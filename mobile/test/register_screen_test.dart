import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/register_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Initial UI shows form without PDF picker',
          (WidgetTester tester) async {
        await tester.pumpWidget(const MaterialApp(home: RegisterPage()));

        expect(find.text('Hesap Oluştur'), findsOneWidget);
        expect(find.byType(TextFormField), findsNWidgets(3));
        expect(find.text('PDF Yükle (Sertifika)'), findsNothing);
      });

  testWidgets('Selecting Dietitian reveals PDF picker',
          (WidgetTester tester) async {
        await tester.pumpWidget(const MaterialApp(home: RegisterPage()));

        await tester.tap(find.byType(DropdownButtonFormField<String>));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Dietitian').last);
        await tester.pumpAndSettle();

        expect(find.text('PDF Yükle (Sertifika)'), findsOneWidget);
      });

  testWidgets('Validation errors appear on empty form submit',
          (WidgetTester tester) async {
        await tester.pumpWidget(const MaterialApp(home: RegisterPage()));

        await tester.tap(find.text('Kayıt Ol'));
        await tester.pump();

        expect(find.text('En az 3 karakter'), findsOneWidget);
        expect(find.text('Geçerli email gir'), findsOneWidget);
        expect(find.text('En az 6 karakter'), findsOneWidget);
      });

  testWidgets('Form passes validation with valid user data',
          (WidgetTester tester) async {
        await tester.pumpWidget(const MaterialApp(home: RegisterPage()));

        await tester.enterText(find.byType(TextFormField).at(0), 'seyituser');
        await tester.enterText(find.byType(TextFormField).at(1), 'seyit@example.com');
        await tester.enterText(find.byType(TextFormField).at(2), '123456');

        await tester.tap(find.text('Kayıt Ol'));
        await tester.pump();

        expect(find.textContaining('En az'), findsNothing);
        expect(find.textContaining('Geçerli email'), findsNothing);
      });
}

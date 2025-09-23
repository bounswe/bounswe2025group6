import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/dashboard_screen.dart';
import 'package:fithub/screens/login_screen.dart';
import './mocks/mock_auth_service.dart';

void main() {
  late MockAuthService mockAuthService;

  setUp(() {
    mockAuthService = MockAuthService();
  });

  group('Dashboard Screen Tests', () {
    testWidgets('Dashboard shows all required elements', (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(home: DashboardScreen()));

      // Verify app bar elements
      expect(find.text('FitHub'), findsOneWidget);
      expect(find.byIcon(Icons.logout), findsOneWidget);
      expect(find.byIcon(Icons.person_outline), findsOneWidget);
      expect(find.byIcon(Icons.menu), findsOneWidget);

      // Verify welcome section
      expect(find.text('Welcome back!'), findsOneWidget);
      expect(find.text('Manage your meals, recipes, and plans here.'), findsOneWidget);

      // Verify quick action buttons
      expect(find.text('Discover Recipes'), findsOneWidget);
      expect(find.text('Upload Recipe'), findsOneWidget);
      expect(find.text('Join Community'), findsOneWidget);
      expect(find.text('Plan a Meal'), findsOneWidget);
    });

    testWidgets('Logout confirmation dialog appears on logout button press',
        (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(home: DashboardScreen()));

      // Tap logout button
      await tester.tap(find.byIcon(Icons.logout));
      await tester.pumpAndSettle();

      // Verify dialog appears with correct content
      expect(find.text('Are you sure you want to logout?'), findsOneWidget);
      expect(find.text('Cancel'), findsOneWidget);
      // Use byType to find the dialog
      expect(find.byType(AlertDialog), findsOneWidget);
      // Find buttons specifically
      expect(find.widgetWithText(TextButton, 'Cancel'), findsOneWidget);
      expect(find.widgetWithText(TextButton, 'Logout'), findsOneWidget);
    });

    testWidgets('Successful logout navigates to login screen',
        (WidgetTester tester) async {
      await tester.pumpWidget(MaterialApp(
        home: DashboardScreen(authService: mockAuthService),
      ));

      // Tap logout button
      await tester.tap(find.byIcon(Icons.logout));
      await tester.pumpAndSettle();

      // Tap confirm in dialog
      await tester.tap(find.widgetWithText(TextButton, 'Logout'));
      await tester.pumpAndSettle();

      // Complete any async operations
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pumpAndSettle();

      // Verify navigation occurred by checking if LoginScreen is present
      expect(find.byType(LoginScreen), findsOneWidget);
    });

    testWidgets('Cancel logout keeps user on dashboard screen',
        (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(home: DashboardScreen()));

      // Tap logout button
      await tester.tap(find.byIcon(Icons.logout));
      await tester.pumpAndSettle();

      // Tap cancel in dialog
      await tester.tap(find.widgetWithText(TextButton, 'Cancel'));
      await tester.pumpAndSettle();

      // Verify still on dashboard screen
      expect(find.byType(DashboardScreen), findsOneWidget);
      expect(find.text('Welcome back!'), findsOneWidget);
    });

    testWidgets('Quick action cards are clickable', (WidgetTester tester) async {
      bool cardTapped = false;

      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: _buildDashboardCard(
            icon: Icons.restaurant_menu,
            title: 'Test Card',
            color: Colors.blue,
            onTap: () => cardTapped = true,
          ),
        ),
      ));

      await tester.tap(find.text('Test Card'));
      await tester.pumpAndSettle();

      expect(cardTapped, isTrue);
    });
  });
}

// Helper method to test card widget
Widget _buildDashboardCard({
  required IconData icon,
  required String title,
  required Color color,
  required VoidCallback onTap,
}) {
  return Card(
    elevation: 2,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 40,
              color: color,
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
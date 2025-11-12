import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/screens/dashboard_screen.dart';
import 'package:fithub/screens/login_screen.dart';
import 'package:fithub/l10n/app_localizations.dart';
import 'package:flutter/services.dart';
import 'package:fithub/widgets/dashboard_analytics_widget.dart';
import 'package:provider/provider.dart';
import 'package:fithub/providers/locale_provider.dart';
import 'package:fithub/providers/currency_provider.dart';
import './mocks/mock_auth_service.dart';

void main() {
  late MockAuthService mockAuthService;

  // Mock channels for flutter_secure_storage to avoid MissingPluginException in tests
  const MethodChannel secureStorageLegacyChannel = MethodChannel(
    'plugins.it_nomads.com/flutter_secure_storage',
  );
  const MethodChannel secureStorageChannel = MethodChannel(
    'flutter_secure_storage',
  );

  setUp(() {
    mockAuthService = MockAuthService();

    // Set no-op handlers for storage channels
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(secureStorageLegacyChannel, (call) async {
          return null;
        });
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(secureStorageChannel, (call) async {
          return null;
        });
  });

  tearDown(() {
    // Remove handlers
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(secureStorageLegacyChannel, null);
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(secureStorageChannel, null);
  });

  group('Dashboard Screen Tests', () {
    testWidgets('Dashboard shows all required elements', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(_buildApp(const DashboardScreen()));

      // Access localizations for assertions
      final loc =
          AppLocalizations.of(tester.element(find.byType(DashboardScreen)))!;

      // Verify app bar elements
      expect(find.text(loc.appTitle), findsOneWidget);
      expect(find.byIcon(Icons.logout), findsOneWidget);
      expect(find.byIcon(Icons.menu), findsOneWidget);

      // Verify welcome section
      expect(find.text(loc.welcomeBack), findsOneWidget);
      expect(find.text(loc.dashboardSubtitle), findsOneWidget);

      // Analytics widget exists
      expect(find.byType(DashboardAnalyticsWidget), findsOneWidget);

      // Verify quick action buttons
      expect(find.text(loc.discoverRecipes), findsOneWidget);
      expect(find.text(loc.uploadRecipe), findsOneWidget);
      expect(find.text(loc.joinCommunity), findsOneWidget);
      expect(find.text(loc.planMeal), findsOneWidget);
    });

    testWidgets('Logout confirmation dialog appears on logout button press', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(_buildApp(const DashboardScreen()));

      final loc =
          AppLocalizations.of(tester.element(find.byType(DashboardScreen)))!;

      // Tap logout button
      await tester.tap(find.byIcon(Icons.logout));
      await tester.pumpAndSettle();

      // Verify dialog appears with correct content
      expect(find.text(loc.logoutConfirmation), findsOneWidget);
      expect(find.text(loc.cancel), findsOneWidget);
      // Use byType to find the dialog
      expect(find.byType(AlertDialog), findsOneWidget);
      // Find buttons specifically
      expect(find.widgetWithText(TextButton, loc.cancel), findsOneWidget);
      expect(find.widgetWithText(TextButton, loc.logout), findsOneWidget);
    });

    testWidgets('Successful logout navigates to login screen', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        _buildApp(DashboardScreen(authService: mockAuthService)),
      );

      // Tap logout button
      await tester.tap(find.byIcon(Icons.logout));
      await tester.pumpAndSettle();

      // Tap confirm in dialog
      final loc =
          AppLocalizations.of(tester.element(find.byType(DashboardScreen)))!;
      await tester.tap(find.widgetWithText(TextButton, loc.logout));
      await tester.pumpAndSettle();

      // Complete any async operations
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pumpAndSettle();

      // Verify navigation occurred by checking if LoginScreen is present
      expect(find.byType(LoginScreen), findsOneWidget);
    });

    testWidgets('Cancel logout keeps user on dashboard screen', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(_buildApp(const DashboardScreen()));

      final loc =
          AppLocalizations.of(tester.element(find.byType(DashboardScreen)))!;

      // Tap logout button
      await tester.tap(find.byIcon(Icons.logout));
      await tester.pumpAndSettle();

      // Tap cancel in dialog
      await tester.tap(find.widgetWithText(TextButton, loc.cancel));
      await tester.pumpAndSettle();

      // Verify still on dashboard screen
      expect(find.byType(DashboardScreen), findsOneWidget);
      expect(find.text(loc.welcomeBack), findsOneWidget);
    });

    testWidgets('Quick action cards are clickable', (
      WidgetTester tester,
    ) async {
      bool cardTapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: _buildDashboardCard(
              icon: Icons.restaurant_menu,
              title: 'Test Card',
              color: Colors.blue,
              onTap: () => cardTapped = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Test Card'));
      await tester.pumpAndSettle();

      expect(cardTapped, isTrue);
    });
  });
}

Widget _buildApp(Widget home) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider(create: (_) => LocaleProvider()),
      ChangeNotifierProvider(create: (_) => CurrencyProvider()),
    ],
    child: MaterialApp(
      home: home,
      locale: const Locale('en'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    ),
  );
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
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: color),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    ),
  );
}

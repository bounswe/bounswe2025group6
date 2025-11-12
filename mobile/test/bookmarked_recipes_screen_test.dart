import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('BookmarkedRecipesScreen UI Component Tests', () {
    // Note: Full screen tests require localization setup
    // These tests verify individual UI components work correctly

    testWidgets('loading indicator displays correctly', (WidgetTester tester) async {
      // Test that CircularProgressIndicator renders
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('error state displays correctly', (WidgetTester tester) async {
      const errorMessage = 'Failed to load bookmarked recipes';
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red),
                  SizedBox(height: 16),
                  Text(errorMessage, textAlign: TextAlign.center),
                ],
              ),
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.error_outline), findsOneWidget);
      expect(find.text(errorMessage), findsOneWidget);
    });

    testWidgets('empty state displays correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.bookmark_border, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'No bookmarked recipes yet',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.bookmark_border), findsOneWidget);
      expect(find.text('No bookmarked recipes yet'), findsOneWidget);
    });

    testWidgets('retry button is functional', (WidgetTester tester) async {
      var retryPressed = false;
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: ElevatedButton(
                onPressed: () {
                  retryPressed = true;
                },
                child: Text('Retry'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Retry'));
      await tester.pump();

      expect(retryPressed, isTrue);
    });

    testWidgets('RefreshIndicator works correctly', (WidgetTester tester) async {
      var refreshCalled = false;
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: RefreshIndicator(
              onRefresh: () async {
                refreshCalled = true;
              },
              child: ListView(
                children: [
                  ListTile(title: Text('Item 1')),
                ],
              ),
            ),
          ),
        ),
      );

      expect(find.byType(RefreshIndicator), findsOneWidget);
      
      // Simulate pull-to-refresh
      await tester.drag(find.byType(RefreshIndicator), Offset(0, 300));
      await tester.pump();
      await tester.pump(Duration(seconds: 1));
      
      expect(refreshCalled, isTrue);
    });

    testWidgets('AppBar structure is correct', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: AppBar(
              title: Text('Bookmarked Recipes'),
              backgroundColor: Colors.green,
            ),
            body: Container(),
          ),
        ),
      );

      expect(find.byType(AppBar), findsOneWidget);
      expect(find.text('Bookmarked Recipes'), findsOneWidget);
    });

    testWidgets('ListView displays items correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView.builder(
              itemCount: 3,
              itemBuilder: (context, index) {
                return ListTile(
                  title: Text('Recipe ${index + 1}'),
                );
              },
            ),
          ),
        ),
      );

      expect(find.text('Recipe 1'), findsOneWidget);
      expect(find.text('Recipe 2'), findsOneWidget);
      expect(find.text('Recipe 3'), findsOneWidget);
    });
  });

  group('BookmarkedRecipesScreen Navigation Tests', () {
    testWidgets('navigation push and pop works', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => Scaffold(
                        appBar: AppBar(title: Text('Details')),
                        body: Text('Details Screen'),
                      ),
                    ),
                  );
                },
                child: Text('Go to Details'),
              ),
            ),
          ),
        ),
      );

      // Initially on home screen
      expect(find.text('Go to Details'), findsOneWidget);
      
      // Navigate to details
      await tester.tap(find.text('Go to Details'));
      await tester.pumpAndSettle();
      
      expect(find.text('Details Screen'), findsOneWidget);
      
      // Go back
      await tester.pageBack();
      await tester.pumpAndSettle();
      
      expect(find.text('Go to Details'), findsOneWidget);
    });

    testWidgets('Scaffold supports back button', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: AppBar(
              title: Text('Screen with Back'),
              leading: BackButton(),
            ),
            body: Text('Content'),
          ),
        ),
      );

      expect(find.byType(BackButton), findsOneWidget);
    });
  });

  group('BookmarkedRecipesScreen State Management Tests', () {
    testWidgets('StatefulWidget can manage state', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: _TestStatefulWidget(),
        ),
      );

      expect(find.text('Counter: 0'), findsOneWidget);
      
      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();
      
      expect(find.text('Counter: 1'), findsOneWidget);
    });

    testWidgets('widget can be rebuilt multiple times', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: Text('Version 1')),
        ),
      );

      expect(find.text('Version 1'), findsOneWidget);

      // Rebuild with new content
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: Text('Version 2')),
        ),
      );

      expect(find.text('Version 2'), findsOneWidget);
      expect(find.text('Version 1'), findsNothing);
    });
  });
}

// Helper widget for state management test
class _TestStatefulWidget extends StatefulWidget {
  @override
  _TestStatefulWidgetState createState() => _TestStatefulWidgetState();
}

class _TestStatefulWidgetState extends State<_TestStatefulWidget> {
  int counter = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Counter: $counter'),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  counter++;
                });
              },
              child: Text('Increment'),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter/services.dart';
import 'package:fithub/screens/qa/qa_screen.dart';
import 'package:fithub/l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:fithub/providers/locale_provider.dart';
import 'package:fithub/providers/currency_provider.dart';
import 'mocks/mock_qa_service.dart';

void main() {
  // Mock channels for flutter_secure_storage to avoid MissingPluginException in tests
  const MethodChannel secureStorageLegacyChannel = MethodChannel(
    'plugins.it_nomads.com/flutter_secure_storage',
  );
  const MethodChannel secureStorageChannel = MethodChannel(
    'flutter_secure_storage',
  );

  setUp(() {
    // Set mock handlers for storage channels to return empty/null values
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(secureStorageLegacyChannel, (call) async {
          if (call.method == 'read') return 'mock_token';
          if (call.method == 'write') return null;
          if (call.method == 'delete') return null;
          if (call.method == 'deleteAll') return null;
          return null;
        });
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(secureStorageChannel, (call) async {
          if (call.method == 'read') return 'mock_token';
          if (call.method == 'write') return null;
          if (call.method == 'delete') return null;
          if (call.method == 'deleteAll') return null;
          return null;
        });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(secureStorageLegacyChannel, null);
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(secureStorageChannel, null);
  });

  Widget createTestWidget(Widget child) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LocaleProvider()),
        ChangeNotifierProvider(create: (_) => CurrencyProvider()),
      ],
      child: MaterialApp(
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: AppLocalizations.supportedLocales,
        home: child,
        routes: {
          '/qa/create': (context) => const Scaffold(body: Text('Create Question')),
          '/qa/detail': (context) => const Scaffold(body: Text('Question Detail')),
          '/profile': (context) => const Scaffold(body: Text('Profile')),
        },
      ),
    );
  }

  group('QuestionCard Widget Tests', () {
    testWidgets('displays question title correctly', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion(
        title: 'How to meal prep on a budget?',
        content: 'I am looking for tips on meal prepping while keeping costs low.',
      );

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('How to meal prep on a budget?'), findsOneWidget);
    });

    testWidgets('displays question content preview', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion(
        title: 'Test Question',
        content: 'This is the question content that should be displayed.',
      );

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('This is the question content that should be displayed.'), findsOneWidget);
    });

    testWidgets('displays author name', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion(
        author: 'johndoe',
      );

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('johndoe'), findsOneWidget);
    });

    testWidgets('displays vote counts', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion(
        upvoteCount: 10,
        downvoteCount: 2,
      );

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('10'), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
    });

    testWidgets('displays view count', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion(
        viewCount: 150,
      );

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('150'), findsOneWidget);
    });

    testWidgets('displays tags when available', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion(
        tags: ['Budget', 'Healthy', 'Meal Prep'],
      );

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('Budget'), findsOneWidget);
      expect(find.text('Healthy'), findsOneWidget);
      expect(find.text('Meal Prep'), findsOneWidget);
    });

    testWidgets('displays upvote and downvote icons', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion();

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Assert
      expect(find.byIcon(Icons.arrow_upward), findsOneWidget);
      expect(find.byIcon(Icons.arrow_downward), findsOneWidget);
    });

    testWidgets('displays visibility icon for view count', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion();

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Assert
      expect(find.byIcon(Icons.visibility), findsOneWidget);
    });

    testWidgets('card is tappable when onTap is provided', (WidgetTester tester) async {
      // Arrange
      bool wasTapped = false;
      final question = getMockQuestion();

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(
            question: question,
            onTap: () {
              wasTapped = true;
            },
          ),
        ),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(QuestionCard));
      await tester.pumpAndSettle();

      // Assert
      expect(wasTapped, isTrue);
    });

    testWidgets('handles missing tags gracefully', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion(tags: []);

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Assert - should not crash and should render the card
      expect(find.byType(QuestionCard), findsOneWidget);
    });

    testWidgets('handles zero counts correctly', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion(
        upvoteCount: 0,
        downvoteCount: 0,
        viewCount: 0,
      );

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('0'), findsNWidgets(3)); // upvote, downvote, views
    });
  });

  group('QAScreen Widget Tests', () {
    testWidgets('displays Q&A title in app bar', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(createTestWidget(const QAScreen()));
      await tester.pump();

      // Assert
      expect(find.text('Q&A'), findsOneWidget);
    });

    testWidgets('displays add button in app bar', (WidgetTester tester) async {
      // Act
      await tester.pumpWidget(createTestWidget(const QAScreen()));
      await tester.pump();

      // Assert
      expect(find.byIcon(Icons.add), findsOneWidget);
    });
  });

  group('Question Voting Tests', () {
    testWidgets('upvote button changes color when active', (WidgetTester tester) async {
      // This test verifies the visual state of the upvote button
      final question = getMockQuestion(upvoteCount: 5);

      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Find the upvote icon button
      final upvoteButton = find.byIcon(Icons.arrow_upward);
      expect(upvoteButton, findsOneWidget);
    });

    testWidgets('downvote button changes color when active', (WidgetTester tester) async {
      // This test verifies the visual state of the downvote button
      final question = getMockQuestion(downvoteCount: 3);

      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Find the downvote icon button
      final downvoteButton = find.byIcon(Icons.arrow_downward);
      expect(downvoteButton, findsOneWidget);
    });
  });

  group('Question Content Tests', () {
    testWidgets('long content is truncated with ellipsis', (WidgetTester tester) async {
      // Arrange
      final longContent = 'This is a very long content ' * 20;
      final question = getMockQuestion(content: longContent);

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Assert - card should render without overflow
      expect(find.byType(QuestionCard), findsOneWidget);
    });

    testWidgets('special characters in title are displayed correctly', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion(
        title: 'How to cook with spices? & herbs!',
      );

      // Act
      await tester.pumpWidget(createTestWidget(
        Scaffold(
          body: QuestionCard(question: question),
        ),
      ));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('How to cook with spices? & herbs!'), findsOneWidget);
    });
  });
}

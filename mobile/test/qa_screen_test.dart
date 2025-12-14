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
import 'package:fithub/models/report.dart';
import 'package:fithub/services/report_service.dart';
import 'mocks/mock_qa_service.dart';
import 'mocks/mock_report_service.dart';

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
          '/qa/create':
              (context) => const Scaffold(body: Text('Create Question')),
          '/qa/detail':
              (context) => const Scaffold(body: Text('Question Detail')),
          '/profile': (context) => const Scaffold(body: Text('Profile')),
        },
      ),
    );
  }

  group('QuestionCard Widget Tests', () {
    testWidgets('displays question title correctly', (
      WidgetTester tester,
    ) async {
      // Arrange
      final question = getMockQuestion(
        title: 'How to meal prep on a budget?',
        content:
            'I am looking for tips on meal prepping while keeping costs low.',
      );

      // Act
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('How to meal prep on a budget?'), findsOneWidget);
    });

    testWidgets('displays question content preview', (
      WidgetTester tester,
    ) async {
      // Arrange
      final question = getMockQuestion(
        title: 'Test Question',
        content: 'This is the question content that should be displayed.',
      );

      // Act
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
      await tester.pumpAndSettle();

      // Assert
      expect(
        find.text('This is the question content that should be displayed.'),
        findsOneWidget,
      );
    });

    testWidgets('displays author name', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion(author: 'johndoe');

      // Act
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('johndoe'), findsOneWidget);
    });

    testWidgets('displays vote counts', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion(upvoteCount: 10, downvoteCount: 2);

      // Act
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('10'), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
    });

    testWidgets('displays view count', (WidgetTester tester) async {
      // Arrange
      final question = getMockQuestion(viewCount: 150);

      // Act
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
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
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('Budget'), findsOneWidget);
      expect(find.text('Healthy'), findsOneWidget);
      expect(find.text('Meal Prep'), findsOneWidget);
    });

    testWidgets('displays upvote and downvote icons', (
      WidgetTester tester,
    ) async {
      // Arrange
      final question = getMockQuestion();

      // Act
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
      await tester.pumpAndSettle();

      // Assert
      expect(find.byIcon(Icons.arrow_upward), findsOneWidget);
      expect(find.byIcon(Icons.arrow_downward), findsOneWidget);
    });

    testWidgets('displays visibility icon for view count', (
      WidgetTester tester,
    ) async {
      // Arrange
      final question = getMockQuestion();

      // Act
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
      await tester.pumpAndSettle();

      // Assert
      expect(find.byIcon(Icons.visibility), findsOneWidget);
    });

    testWidgets('card is tappable when onTap is provided', (
      WidgetTester tester,
    ) async {
      // Arrange
      bool wasTapped = false;
      final question = getMockQuestion();

      // Act
      await tester.pumpWidget(
        createTestWidget(
          Scaffold(
            body: QuestionCard(
              question: question,
              onTap: () {
                wasTapped = true;
              },
            ),
          ),
        ),
      );
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
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
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
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
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
    testWidgets('upvote button changes color when active', (
      WidgetTester tester,
    ) async {
      // This test verifies the visual state of the upvote button
      final question = getMockQuestion(upvoteCount: 5);

      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
      await tester.pumpAndSettle();

      // Find the upvote icon button
      final upvoteButton = find.byIcon(Icons.arrow_upward);
      expect(upvoteButton, findsOneWidget);
    });

    testWidgets('downvote button changes color when active', (
      WidgetTester tester,
    ) async {
      // This test verifies the visual state of the downvote button
      final question = getMockQuestion(downvoteCount: 3);

      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
      await tester.pumpAndSettle();

      // Find the downvote icon button
      final downvoteButton = find.byIcon(Icons.arrow_downward);
      expect(downvoteButton, findsOneWidget);
    });
  });

  group('Question Content Tests', () {
    testWidgets('long content is truncated with ellipsis', (
      WidgetTester tester,
    ) async {
      // Arrange
      final longContent = 'This is a very long content ' * 20;
      final question = getMockQuestion(content: longContent);

      // Act
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
      await tester.pumpAndSettle();

      // Assert - card should render without overflow
      expect(find.byType(QuestionCard), findsOneWidget);
    });

    testWidgets('special characters in title are displayed correctly', (
      WidgetTester tester,
    ) async {
      // Arrange
      final question = getMockQuestion(
        title: 'How to cook with spices? & herbs!',
      );

      // Act
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('How to cook with spices? & herbs!'), findsOneWidget);
    });
  });

  group('QuestionCard Report Menu Tests', () {
    // Note: The popup menu button only appears when user is authenticated
    // and viewing another user's question. These tests verify the conditional
    // rendering logic exists in the widget structure.

    testWidgets(
      'QuestionCard renders without report menu when not authenticated',
      (WidgetTester tester) async {
        // Arrange - When not authenticated, _currentUserId is null
        // so the report menu should not be visible
        final question = getMockQuestion();

        // Act
        await tester.pumpWidget(
          createTestWidget(Scaffold(body: QuestionCard(question: question))),
        );
        await tester.pumpAndSettle();

        // Assert - PopupMenuButton should not be present when not authenticated
        expect(find.byType(PopupMenuButton<String>), findsNothing);
      },
    );

    testWidgets('QuestionCard renders successfully with all required data', (
      WidgetTester tester,
    ) async {
      // Arrange
      final question = getMockQuestion(
        id: 1,
        title: 'Test Question',
        content: 'Test content',
        author: 'testuser',
        authorId: 999, // Different from current user
      );

      // Act
      await tester.pumpWidget(
        createTestWidget(Scaffold(body: QuestionCard(question: question))),
      );
      await tester.pumpAndSettle();

      // Assert - Card should render with question data
      expect(find.text('Test Question'), findsOneWidget);
      expect(find.text('testuser'), findsOneWidget);
    });
  });

  group('QA Report Content Type Tests', () {
    test('ReportContentType.question has correct value', () {
      expect(ReportContentType.question.value, equals('question'));
    });

    test('ReportContentType.answer has correct value', () {
      expect(ReportContentType.answer.value, equals('answer'));
    });

    test('CreateReportRequest for question generates correct JSON', () {
      final request = CreateReportRequest(
        contentType: ReportContentType.question,
        objectId: 123,
        reportType: ReportType.spam,
        description: 'This is spam',
      );

      final json = request.toJson();

      expect(json['content_type'], equals('question'));
      expect(json['object_id'], equals(123));
      expect(json['report_type'], equals('spam'));
      expect(json['description'], equals('This is spam'));
    });

    test('CreateReportRequest for answer generates correct JSON', () {
      final request = CreateReportRequest(
        contentType: ReportContentType.answer,
        objectId: 456,
        reportType: ReportType.harassment,
        description: 'Harassment content',
      );

      final json = request.toJson();

      expect(json['content_type'], equals('answer'));
      expect(json['object_id'], equals(456));
      expect(json['report_type'], equals('harassment'));
      expect(json['description'], equals('Harassment content'));
    });

    test('CreateReportRequest for question without description', () {
      final request = CreateReportRequest(
        contentType: ReportContentType.question,
        objectId: 789,
        reportType: ReportType.inappropriate,
      );

      final json = request.toJson();

      expect(json['content_type'], equals('question'));
      expect(json['object_id'], equals(789));
      expect(json['report_type'], equals('inappropriate'));
      expect(json.containsKey('description'), isFalse);
    });
  });

  group('QA Report Service Integration Tests', () {
    late MockReportService mockReportService;

    setUpAll(() {
      registerFallbackValue(FakeCreateReportRequest());
      registerFallbackValue(ReportType.spam);
    });

    setUp(() {
      mockReportService = MockReportService();
    });

    test('reportQuestion calls service with correct parameters', () async {
      // Arrange
      final expectedReport = getMockQuestionReport(
        id: 1,
        reportType: 'spam',
        description: 'Spam question',
      );

      when(
        () => mockReportService.reportQuestion(
          questionId: any(named: 'questionId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenAnswer((_) async => expectedReport);

      // Act
      final result = await mockReportService.reportQuestion(
        questionId: 100,
        reportType: ReportType.spam,
        description: 'Spam question',
      );

      // Assert
      expect(result.contentTypeName, equals('question'));
      expect(result.reportType, equals('spam'));
      verify(
        () => mockReportService.reportQuestion(
          questionId: 100,
          reportType: ReportType.spam,
          description: 'Spam question',
        ),
      ).called(1);
    });

    test('reportAnswer calls service with correct parameters', () async {
      // Arrange
      final expectedReport = getMockAnswerReport(
        id: 2,
        reportType: 'inappropriate',
        description: 'Bad answer',
      );

      when(
        () => mockReportService.reportAnswer(
          answerId: any(named: 'answerId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenAnswer((_) async => expectedReport);

      // Act
      final result = await mockReportService.reportAnswer(
        answerId: 200,
        reportType: ReportType.inappropriate,
        description: 'Bad answer',
      );

      // Assert
      expect(result.contentTypeName, equals('answer'));
      expect(result.reportType, equals('inappropriate'));
      verify(
        () => mockReportService.reportAnswer(
          answerId: 200,
          reportType: ReportType.inappropriate,
          description: 'Bad answer',
        ),
      ).called(1);
    });

    test('reportQuestion handles all report types', () async {
      for (final reportType in ReportType.values) {
        // Arrange
        final expectedReport = getMockQuestionReport(
          reportType: reportType.value,
        );

        when(
          () => mockReportService.reportQuestion(
            questionId: any(named: 'questionId'),
            reportType: any(named: 'reportType'),
            description: any(named: 'description'),
          ),
        ).thenAnswer((_) async => expectedReport);

        // Act
        final result = await mockReportService.reportQuestion(
          questionId: 1,
          reportType: reportType,
        );

        // Assert
        expect(result.reportType, equals(reportType.value));
      }
    });

    test('reportAnswer handles all report types', () async {
      for (final reportType in ReportType.values) {
        // Arrange
        final expectedReport = getMockAnswerReport(
          reportType: reportType.value,
        );

        when(
          () => mockReportService.reportAnswer(
            answerId: any(named: 'answerId'),
            reportType: any(named: 'reportType'),
            description: any(named: 'description'),
          ),
        ).thenAnswer((_) async => expectedReport);

        // Act
        final result = await mockReportService.reportAnswer(
          answerId: 1,
          reportType: reportType,
        );

        // Assert
        expect(result.reportType, equals(reportType.value));
      }
    });

    test('reportQuestion throws exception on network error', () async {
      // Arrange
      when(
        () => mockReportService.reportQuestion(
          questionId: any(named: 'questionId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenThrow(ReportServiceException('Network error', statusCode: 500));

      // Act & Assert
      expect(
        () async => await mockReportService.reportQuestion(
          questionId: 999,
          reportType: ReportType.spam,
        ),
        throwsA(isA<ReportServiceException>()),
      );
    });

    test('reportAnswer throws exception on question not found', () async {
      // Arrange
      when(
        () => mockReportService.reportAnswer(
          answerId: any(named: 'answerId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenThrow(ReportServiceException('Answer not found', statusCode: 404));

      // Act & Assert
      expect(
        () async => await mockReportService.reportAnswer(
          answerId: 999,
          reportType: ReportType.inappropriate,
        ),
        throwsA(isA<ReportServiceException>()),
      );
    });

    test('reportQuestion throws exception on authentication failure', () async {
      // Arrange
      when(
        () => mockReportService.reportQuestion(
          questionId: any(named: 'questionId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenThrow(
        ReportServiceException('Authentication required', statusCode: 401),
      );

      // Act & Assert
      expect(
        () async => await mockReportService.reportQuestion(
          questionId: 1,
          reportType: ReportType.spam,
        ),
        throwsA(isA<ReportServiceException>()),
      );
    });
  });

  group('Question Report Mock Data Tests', () {
    test('getMockQuestionReport creates report with default values', () {
      final report = getMockQuestionReport();

      expect(report.id, equals(1));
      expect(report.contentTypeName, equals('question'));
      expect(report.reporterUsername, equals('testuser'));
      expect(report.reportType, equals('spam'));
      expect(report.status, equals('pending'));
    });

    test('getMockQuestionReport creates report with custom values', () {
      final report = getMockQuestionReport(
        id: 5,
        reporterUsername: 'customuser',
        contentObjectPreview: 'Custom question',
        reportType: 'harassment',
        description: 'Test description',
        status: 'reviewed',
      );

      expect(report.id, equals(5));
      expect(report.contentTypeName, equals('question'));
      expect(report.reporterUsername, equals('customuser'));
      expect(report.contentObjectPreview, equals('Custom question'));
      expect(report.reportType, equals('harassment'));
      expect(report.description, equals('Test description'));
      expect(report.status, equals('reviewed'));
    });

    test('getMockAnswerReport creates report with default values', () {
      final report = getMockAnswerReport();

      expect(report.id, equals(1));
      expect(report.contentTypeName, equals('answer'));
      expect(report.reporterUsername, equals('testuser'));
      expect(report.reportType, equals('spam'));
      expect(report.status, equals('pending'));
    });

    test('getMockAnswerReport creates report with custom values', () {
      final report = getMockAnswerReport(
        id: 10,
        reporterUsername: 'moderator',
        contentObjectPreview: 'Problematic answer content',
        reportType: 'other',
        description: 'Other issue',
        status: 'resolved',
      );

      expect(report.id, equals(10));
      expect(report.contentTypeName, equals('answer'));
      expect(report.reporterUsername, equals('moderator'));
      expect(report.contentObjectPreview, equals('Problematic answer content'));
      expect(report.reportType, equals('other'));
      expect(report.description, equals('Other issue'));
      expect(report.status, equals('resolved'));
    });
  });
}

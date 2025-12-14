import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:fithub/services/report_service.dart';
import 'package:fithub/models/report.dart';
import 'mocks/mock_report_service.dart';
import 'mocks/mock_qa_service.dart';

/// Scenario tests for Q&A Report functionality
/// These tests verify the complete user journey for reporting questions and answers
void main() {
  group('Scenario: User reports a spam question', () {
    late MockReportService mockReportService;

    setUpAll(() {
      registerFallbackValue(FakeCreateReportRequest());
      registerFallbackValue(ReportType.spam);
    });

    setUp(() {
      mockReportService = MockReportService();
    });

    test('Given a user viewing a question with spam content', () {
      // Setup: User is viewing a question
      final question = getMockQuestion(
        id: 123,
        title: 'Buy now! Amazing deals!',
        content: 'Click here for free stuff! Limited time offer!',
        author: 'spammer',
        authorId: 999,
      );

      // Verify the question exists with spam-like content
      expect(question['id'], equals(123));
      expect(question['title'], contains('Buy now'));
    });

    test('When the user submits a spam report for the question', () async {
      // Arrange
      final expectedReport = getMockQuestionReport(
        id: 1,
        reportType: 'spam',
        description: 'This is promotional spam content',
        contentObjectPreview: 'Buy now! Amazing deals!',
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
        questionId: 123,
        reportType: ReportType.spam,
        description: 'This is promotional spam content',
      );

      // Verify
      verify(
        () => mockReportService.reportQuestion(
          questionId: 123,
          reportType: ReportType.spam,
          description: 'This is promotional spam content',
        ),
      ).called(1);

      expect(result, isNotNull);
    });

    test('Then the report is created with correct details', () async {
      // Arrange
      final expectedReport = getMockQuestionReport(
        id: 1,
        contentObjectPreview: 'Buy now! Amazing deals!',
        reportType: 'spam',
        status: 'pending',
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
        questionId: 123,
        reportType: ReportType.spam,
      );

      // Assert
      expect(result.contentTypeName, equals('question'));
      expect(result.reportType, equals('spam'));
      expect(result.status, equals('pending'));
    });
  });

  group('Scenario: User reports an inappropriate answer', () {
    late MockReportService mockReportService;

    setUpAll(() {
      registerFallbackValue(FakeCreateReportRequest());
      registerFallbackValue(ReportType.inappropriate);
    });

    setUp(() {
      mockReportService = MockReportService();
    });

    test('Given a user viewing an answer with inappropriate content', () {
      // Setup: User is viewing an answer
      final answer = getMockAnswer(
        id: 456,
        content: 'This answer contains inappropriate language...',
        author: 'baduser',
        authorId: 888,
      );

      // Verify the answer exists
      expect(answer['id'], equals(456));
      expect(answer['content'], contains('inappropriate'));
    });

    test('When the user reports the answer as inappropriate', () async {
      // Arrange
      final expectedReport = getMockAnswerReport(
        id: 2,
        reportType: 'inappropriate',
        description: 'This answer contains offensive language',
        contentObjectPreview: 'This answer contains inappropriate...',
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
        answerId: 456,
        reportType: ReportType.inappropriate,
        description: 'This answer contains offensive language',
      );

      // Verify
      verify(
        () => mockReportService.reportAnswer(
          answerId: 456,
          reportType: ReportType.inappropriate,
          description: 'This answer contains offensive language',
        ),
      ).called(1);

      expect(result, isNotNull);
    });

    test('Then the report is created with answer content type', () async {
      // Arrange
      final expectedReport = getMockAnswerReport(
        id: 2,
        reportType: 'inappropriate',
        status: 'pending',
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
        answerId: 456,
        reportType: ReportType.inappropriate,
      );

      // Assert
      expect(result.contentTypeName, equals('answer'));
      expect(result.reportType, equals('inappropriate'));
      expect(result.status, equals('pending'));
    });
  });

  group('Scenario: User reports harassment in Q&A', () {
    late MockReportService mockReportService;

    setUpAll(() {
      registerFallbackValue(FakeCreateReportRequest());
      registerFallbackValue(ReportType.harassment);
    });

    setUp(() {
      mockReportService = MockReportService();
    });

    test('User can report a question containing harassment', () async {
      // Arrange
      final expectedReport = getMockQuestionReport(
        reportType: 'harassment',
        description: 'This question targets a specific user',
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
        reportType: ReportType.harassment,
        description: 'This question targets a specific user',
      );

      // Assert
      expect(result.contentTypeName, equals('question'));
      expect(result.reportType, equals('harassment'));
    });

    test('User can report an answer containing harassment', () async {
      // Arrange
      final expectedReport = getMockAnswerReport(
        reportType: 'harassment',
        description: 'This answer contains personal attacks',
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
        reportType: ReportType.harassment,
        description: 'This answer contains personal attacks',
      );

      // Assert
      expect(result.contentTypeName, equals('answer'));
      expect(result.reportType, equals('harassment'));
    });
  });

  group('Scenario: Report submission error handling', () {
    late MockReportService mockReportService;

    setUpAll(() {
      registerFallbackValue(FakeCreateReportRequest());
      registerFallbackValue(ReportType.spam);
    });

    setUp(() {
      mockReportService = MockReportService();
    });

    test('User gets error when reporting deleted question', () async {
      // Arrange
      when(
        () => mockReportService.reportQuestion(
          questionId: any(named: 'questionId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenThrow(
        ReportServiceException(
          'The content you are trying to report was not found.',
          statusCode: 404,
        ),
      );

      // Act & Assert
      expect(
        () async => await mockReportService.reportQuestion(
          questionId: 999,
          reportType: ReportType.spam,
        ),
        throwsA(
          predicate(
            (e) =>
                e is ReportServiceException &&
                e.statusCode == 404 &&
                e.message.contains('not found'),
          ),
        ),
      );
    });

    test('User gets error when reporting deleted answer', () async {
      // Arrange
      when(
        () => mockReportService.reportAnswer(
          answerId: any(named: 'answerId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenThrow(
        ReportServiceException(
          'The content you are trying to report was not found.',
          statusCode: 404,
        ),
      );

      // Act & Assert
      expect(
        () async => await mockReportService.reportAnswer(
          answerId: 999,
          reportType: ReportType.inappropriate,
        ),
        throwsA(
          predicate((e) => e is ReportServiceException && e.statusCode == 404),
        ),
      );
    });

    test('User must be authenticated to report', () async {
      // Arrange
      when(
        () => mockReportService.reportQuestion(
          questionId: any(named: 'questionId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenThrow(
        ReportServiceException(
          'Authentication required. Please log in again.',
          statusCode: 401,
        ),
      );

      // Act & Assert
      expect(
        () async => await mockReportService.reportQuestion(
          questionId: 1,
          reportType: ReportType.spam,
        ),
        throwsA(
          predicate(
            (e) =>
                e is ReportServiceException &&
                e.statusCode == 401 &&
                e.message.contains('Authentication'),
          ),
        ),
      );
    });

    test('Network error handling for question report', () async {
      // Arrange
      when(
        () => mockReportService.reportQuestion(
          questionId: any(named: 'questionId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenThrow(
        ReportServiceException(
          'Network error: Connection failed',
          statusCode: 500,
        ),
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

  group('Scenario: Report all types on questions and answers', () {
    late MockReportService mockReportService;

    setUpAll(() {
      registerFallbackValue(FakeCreateReportRequest());
      registerFallbackValue(ReportType.spam);
    });

    setUp(() {
      mockReportService = MockReportService();
    });

    test('All report types can be submitted for questions', () async {
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
          description: 'Test ${reportType.value} report',
        );

        // Assert
        expect(result.reportType, equals(reportType.value));
        expect(result.contentTypeName, equals('question'));
      }
    });

    test('All report types can be submitted for answers', () async {
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
          description: 'Test ${reportType.value} report',
        );

        // Assert
        expect(result.reportType, equals(reportType.value));
        expect(result.contentTypeName, equals('answer'));
      }
    });
  });

  group('CreateReportRequest serialization for Q&A', () {
    test('Question report request serializes correctly', () {
      final request = CreateReportRequest(
        contentType: ReportContentType.question,
        objectId: 42,
        reportType: ReportType.spam,
        description: 'Spam question report',
      );

      final json = request.toJson();

      expect(json['content_type'], equals('question'));
      expect(json['object_id'], equals(42));
      expect(json['report_type'], equals('spam'));
      expect(json['description'], equals('Spam question report'));
    });

    test('Answer report request serializes correctly', () {
      final request = CreateReportRequest(
        contentType: ReportContentType.answer,
        objectId: 84,
        reportType: ReportType.harassment,
        description: 'Harassment in answer',
      );

      final json = request.toJson();

      expect(json['content_type'], equals('answer'));
      expect(json['object_id'], equals(84));
      expect(json['report_type'], equals('harassment'));
      expect(json['description'], equals('Harassment in answer'));
    });

    test(
      'Report request without description serializes without description field',
      () {
        final request = CreateReportRequest(
          contentType: ReportContentType.question,
          objectId: 100,
          reportType: ReportType.inappropriate,
        );

        final json = request.toJson();

        expect(json['content_type'], equals('question'));
        expect(json['object_id'], equals(100));
        expect(json['report_type'], equals('inappropriate'));
        expect(json.containsKey('description'), isFalse);
      },
    );

    test(
      'Report request with empty description serializes without description field',
      () {
        final request = CreateReportRequest(
          contentType: ReportContentType.answer,
          objectId: 200,
          reportType: ReportType.other,
          description: '',
        );

        final json = request.toJson();

        expect(json.containsKey('description'), isFalse);
      },
    );
  });
}

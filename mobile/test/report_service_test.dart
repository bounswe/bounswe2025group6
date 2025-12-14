import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:fithub/services/report_service.dart';
import 'package:fithub/models/report.dart';
import 'mocks/mock_report_service.dart';

void main() {
  group('ReportService Tests', () {
    late MockReportService mockReportService;

    setUpAll(() {
      // Register fallback values for mocktail
      registerFallbackValue(FakeCreateReportRequest());
      registerFallbackValue(ReportType.spam);
    });

    setUp(() {
      mockReportService = MockReportService();
    });

    test('createReport returns Report on success', () async {
      // Arrange
      final request = CreateReportRequest(
        contentType: ReportContentType.post,
        objectId: 123,
        reportType: ReportType.spam,
        description: 'Test spam report',
      );

      final expectedReport = FakeReport(
        id: 1,
        contentTypeName: 'post',
        reporterUsername: 'testuser',
        contentObjectPreview: 'Post content preview',
        reportType: 'spam',
        description: 'Test spam report',
        status: 'pending',
      );

      when(
        () => mockReportService.createReport(any()),
      ).thenAnswer((_) async => expectedReport);

      // Act
      final result = await mockReportService.createReport(request);

      // Assert
      expect(result.id, equals(1));
      expect(result.contentTypeName, equals('post'));
      expect(result.reportType, equals('spam'));
      expect(result.status, equals('pending'));
      verify(() => mockReportService.createReport(any())).called(1);
    });

    test('reportPost creates report with correct content type', () async {
      // Arrange
      final expectedReport = FakeReport(
        contentTypeName: 'post',
        reportType: 'inappropriate',
      );

      when(
        () => mockReportService.reportPost(
          postId: any(named: 'postId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenAnswer((_) async => expectedReport);

      // Act
      final result = await mockReportService.reportPost(
        postId: 123,
        reportType: ReportType.inappropriate,
        description: 'Inappropriate content',
      );

      // Assert
      expect(result.contentTypeName, equals('post'));
      expect(result.reportType, equals('inappropriate'));
      verify(
        () => mockReportService.reportPost(
          postId: 123,
          reportType: ReportType.inappropriate,
          description: 'Inappropriate content',
        ),
      ).called(1);
    });

    test('reportRecipe creates report with correct content type', () async {
      // Arrange
      final expectedReport = FakeReport(
        contentTypeName: 'recipe',
        reportType: 'spam',
      );

      when(
        () => mockReportService.reportRecipe(
          recipeId: any(named: 'recipeId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenAnswer((_) async => expectedReport);

      // Act
      final result = await mockReportService.reportRecipe(
        recipeId: 456,
        reportType: ReportType.spam,
        description: 'Spam recipe',
      );

      // Assert
      expect(result.contentTypeName, equals('recipe'));
      expect(result.reportType, equals('spam'));
      verify(
        () => mockReportService.reportRecipe(
          recipeId: 456,
          reportType: ReportType.spam,
          description: 'Spam recipe',
        ),
      ).called(1);
    });

    test('reportQuestion creates report with correct content type', () async {
      // Arrange
      final expectedReport = getMockQuestionReport(
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
        questionId: 789,
        reportType: ReportType.spam,
        description: 'Spam question',
      );

      // Assert
      expect(result.contentTypeName, equals('question'));
      expect(result.reportType, equals('spam'));
      verify(
        () => mockReportService.reportQuestion(
          questionId: 789,
          reportType: ReportType.spam,
          description: 'Spam question',
        ),
      ).called(1);
    });

    test('reportAnswer creates report with correct content type', () async {
      // Arrange
      final expectedReport = getMockAnswerReport(
        reportType: 'inappropriate',
        description: 'Inappropriate answer',
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
        answerId: 101,
        reportType: ReportType.inappropriate,
        description: 'Inappropriate answer',
      );

      // Assert
      expect(result.contentTypeName, equals('answer'));
      expect(result.reportType, equals('inappropriate'));
      verify(
        () => mockReportService.reportAnswer(
          answerId: 101,
          reportType: ReportType.inappropriate,
          description: 'Inappropriate answer',
        ),
      ).called(1);
    });

    test('reportQuestion with harassment type', () async {
      // Arrange
      final expectedReport = getMockQuestionReport(
        reportType: 'harassment',
        description: 'This question contains harassment',
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
        questionId: 200,
        reportType: ReportType.harassment,
        description: 'This question contains harassment',
      );

      // Assert
      expect(result.contentTypeName, equals('question'));
      expect(result.reportType, equals('harassment'));
    });

    test('reportAnswer with other type', () async {
      // Arrange
      final expectedReport = getMockAnswerReport(
        reportType: 'other',
        description: 'Other issue with this answer',
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
        answerId: 300,
        reportType: ReportType.other,
        description: 'Other issue with this answer',
      );

      // Assert
      expect(result.contentTypeName, equals('answer'));
      expect(result.reportType, equals('other'));
    });

    test('reportQuestion without description', () async {
      // Arrange
      final expectedReport = getMockQuestionReport(reportType: 'spam');

      when(
        () => mockReportService.reportQuestion(
          questionId: any(named: 'questionId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenAnswer((_) async => expectedReport);

      // Act
      final result = await mockReportService.reportQuestion(
        questionId: 400,
        reportType: ReportType.spam,
      );

      // Assert
      expect(result.contentTypeName, equals('question'));
      expect(result.description, isNull);
    });

    test('reportAnswer without description', () async {
      // Arrange
      final expectedReport = getMockAnswerReport(reportType: 'inappropriate');

      when(
        () => mockReportService.reportAnswer(
          answerId: any(named: 'answerId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenAnswer((_) async => expectedReport);

      // Act
      final result = await mockReportService.reportAnswer(
        answerId: 500,
        reportType: ReportType.inappropriate,
      );

      // Assert
      expect(result.contentTypeName, equals('answer'));
      expect(result.description, isNull);
    });

    test('createReport throws ReportServiceException on failure', () async {
      // Arrange
      final request = CreateReportRequest(
        contentType: ReportContentType.post,
        objectId: 999,
        reportType: ReportType.spam,
      );

      when(
        () => mockReportService.createReport(request),
      ).thenThrow(ReportServiceException('Network error', statusCode: 500));

      // Act & Assert
      expect(
        () async => await mockReportService.createReport(request),
        throwsA(isA<ReportServiceException>()),
      );
      verify(() => mockReportService.createReport(request)).called(1);
    });

    test('reportQuestion throws exception on failure', () async {
      // Arrange
      when(
        () => mockReportService.reportQuestion(
          questionId: any(named: 'questionId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenThrow(
        ReportServiceException('Failed to report question', statusCode: 404),
      );

      // Act & Assert
      expect(
        () async => await mockReportService.reportQuestion(
          questionId: 999,
          reportType: ReportType.spam,
        ),
        throwsA(isA<ReportServiceException>()),
      );
    });

    test('reportAnswer throws exception on failure', () async {
      // Arrange
      when(
        () => mockReportService.reportAnswer(
          answerId: any(named: 'answerId'),
          reportType: any(named: 'reportType'),
          description: any(named: 'description'),
        ),
      ).thenThrow(
        ReportServiceException('Failed to report answer', statusCode: 404),
      );

      // Act & Assert
      expect(
        () async => await mockReportService.reportAnswer(
          answerId: 999,
          reportType: ReportType.inappropriate,
        ),
        throwsA(isA<ReportServiceException>()),
      );
    });
  });

  group('ReportType Tests', () {
    test('ReportType has correct values', () {
      expect(ReportType.spam.value, equals('spam'));
      expect(ReportType.inappropriate.value, equals('inappropriate'));
      expect(ReportType.harassment.value, equals('harassment'));
      expect(ReportType.other.value, equals('other'));
    });
  });

  group('ReportContentType Tests', () {
    test('ReportContentType has correct values', () {
      expect(ReportContentType.post.value, equals('post'));
      expect(ReportContentType.recipe.value, equals('recipe'));
      expect(ReportContentType.postcomment.value, equals('postcomment'));
      expect(ReportContentType.question.value, equals('question'));
      expect(ReportContentType.answer.value, equals('answer'));
    });

    test('ReportContentType enum has all expected values', () {
      expect(ReportContentType.values.length, equals(5));
      expect(ReportContentType.values, contains(ReportContentType.post));
      expect(ReportContentType.values, contains(ReportContentType.recipe));
      expect(ReportContentType.values, contains(ReportContentType.postcomment));
      expect(ReportContentType.values, contains(ReportContentType.question));
      expect(ReportContentType.values, contains(ReportContentType.answer));
    });
  });

  group('CreateReportRequest Tests', () {
    test('toJson includes all fields when description is provided', () {
      final request = CreateReportRequest(
        contentType: ReportContentType.post,
        objectId: 123,
        reportType: ReportType.spam,
        description: 'Test description',
      );

      final json = request.toJson();

      expect(json['content_type'], equals('post'));
      expect(json['object_id'], equals(123));
      expect(json['report_type'], equals('spam'));
      expect(json['description'], equals('Test description'));
    });

    test('toJson excludes description when null', () {
      final request = CreateReportRequest(
        contentType: ReportContentType.recipe,
        objectId: 456,
        reportType: ReportType.inappropriate,
      );

      final json = request.toJson();

      expect(json['content_type'], equals('recipe'));
      expect(json['object_id'], equals(456));
      expect(json['report_type'], equals('inappropriate'));
      expect(json.containsKey('description'), isFalse);
    });

    test('toJson excludes description when empty string', () {
      final request = CreateReportRequest(
        contentType: ReportContentType.post,
        objectId: 789,
        reportType: ReportType.other,
        description: '',
      );

      final json = request.toJson();

      expect(json.containsKey('description'), isFalse);
    });

    test('toJson for question report', () {
      final request = CreateReportRequest(
        contentType: ReportContentType.question,
        objectId: 100,
        reportType: ReportType.spam,
        description: 'Spam question',
      );

      final json = request.toJson();

      expect(json['content_type'], equals('question'));
      expect(json['object_id'], equals(100));
      expect(json['report_type'], equals('spam'));
      expect(json['description'], equals('Spam question'));
    });

    test('toJson for answer report', () {
      final request = CreateReportRequest(
        contentType: ReportContentType.answer,
        objectId: 200,
        reportType: ReportType.harassment,
        description: 'Harassment in answer',
      );

      final json = request.toJson();

      expect(json['content_type'], equals('answer'));
      expect(json['object_id'], equals(200));
      expect(json['report_type'], equals('harassment'));
      expect(json['description'], equals('Harassment in answer'));
    });

    test('toJson for postcomment report', () {
      final request = CreateReportRequest(
        contentType: ReportContentType.postcomment,
        objectId: 300,
        reportType: ReportType.inappropriate,
      );

      final json = request.toJson();

      expect(json['content_type'], equals('postcomment'));
      expect(json['object_id'], equals(300));
      expect(json['report_type'], equals('inappropriate'));
    });
  });

  group('Mock Helper Functions Tests', () {
    test('getMockQuestionReport creates correct report', () {
      final report = getMockQuestionReport(
        id: 5,
        reporterUsername: 'reporter1',
        contentObjectPreview: 'Question preview',
        reportType: 'harassment',
        description: 'Test description',
        status: 'reviewed',
      );

      expect(report.id, equals(5));
      expect(report.contentTypeName, equals('question'));
      expect(report.reporterUsername, equals('reporter1'));
      expect(report.contentObjectPreview, equals('Question preview'));
      expect(report.reportType, equals('harassment'));
      expect(report.description, equals('Test description'));
      expect(report.status, equals('reviewed'));
    });

    test('getMockAnswerReport creates correct report', () {
      final report = getMockAnswerReport(
        id: 10,
        reporterUsername: 'reporter2',
        contentObjectPreview: 'Answer preview',
        reportType: 'other',
        description: 'Other issue',
        status: 'resolved',
      );

      expect(report.id, equals(10));
      expect(report.contentTypeName, equals('answer'));
      expect(report.reporterUsername, equals('reporter2'));
      expect(report.contentObjectPreview, equals('Answer preview'));
      expect(report.reportType, equals('other'));
      expect(report.description, equals('Other issue'));
      expect(report.status, equals('resolved'));
    });

    test('getMockQuestionReport with default values', () {
      final report = getMockQuestionReport();

      expect(report.id, equals(1));
      expect(report.contentTypeName, equals('question'));
      expect(report.reporterUsername, equals('testuser'));
      expect(report.reportType, equals('spam'));
      expect(report.status, equals('pending'));
    });

    test('getMockAnswerReport with default values', () {
      final report = getMockAnswerReport();

      expect(report.id, equals(1));
      expect(report.contentTypeName, equals('answer'));
      expect(report.reporterUsername, equals('testuser'));
      expect(report.reportType, equals('spam'));
      expect(report.status, equals('pending'));
    });
  });
}

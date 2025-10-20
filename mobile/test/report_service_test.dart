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

      when(() => mockReportService.createReport(any()))
          .thenAnswer((_) async => expectedReport);

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

      when(() => mockReportService.reportPost(
            postId: any(named: 'postId'),
            reportType: any(named: 'reportType'),
            description: any(named: 'description'),
          )).thenAnswer((_) async => expectedReport);

      // Act
      final result = await mockReportService.reportPost(
        postId: 123,
        reportType: ReportType.inappropriate,
        description: 'Inappropriate content',
      );

      // Assert
      expect(result.contentTypeName, equals('post'));
      expect(result.reportType, equals('inappropriate'));
      verify(() => mockReportService.reportPost(
            postId: 123,
            reportType: ReportType.inappropriate,
            description: 'Inappropriate content',
          )).called(1);
    });

    test('reportRecipe creates report with correct content type', () async {
      // Arrange
      final expectedReport = FakeReport(
        contentTypeName: 'recipe',
        reportType: 'spam',
      );

      when(() => mockReportService.reportRecipe(
            recipeId: any(named: 'recipeId'),
            reportType: any(named: 'reportType'),
            description: any(named: 'description'),
          )).thenAnswer((_) async => expectedReport);

      // Act
      final result = await mockReportService.reportRecipe(
        recipeId: 456,
        reportType: ReportType.spam,
        description: 'Spam recipe',
      );

      // Assert
      expect(result.contentTypeName, equals('recipe'));
      expect(result.reportType, equals('spam'));
      verify(() => mockReportService.reportRecipe(
            recipeId: 456,
            reportType: ReportType.spam,
            description: 'Spam recipe',
          )).called(1);
    });

    test('createReport throws ReportServiceException on failure', () async {
      // Arrange
      final request = CreateReportRequest(
        contentType: ReportContentType.post,
        objectId: 999,
        reportType: ReportType.spam,
      );

      when(() => mockReportService.createReport(request))
          .thenThrow(ReportServiceException('Network error', statusCode: 500));

      // Act & Assert
      expect(
        () async => await mockReportService.createReport(request),
        throwsA(isA<ReportServiceException>()),
      );
      verify(() => mockReportService.createReport(request)).called(1);
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
  });
}


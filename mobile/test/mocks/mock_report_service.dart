import 'package:mocktail/mocktail.dart';
import 'package:fithub/services/report_service.dart';
import 'package:fithub/models/report.dart';

class MockReportService extends Mock implements ReportService {
  // Mock implementation for testing
}

// Fake classes for mocktail
class FakeCreateReportRequest extends Fake implements CreateReportRequest {}

class FakeReport extends Fake implements Report {
  @override
  final int id;
  @override
  final String contentTypeName;
  @override
  final String reporterUsername;
  @override
  final String contentObjectPreview;
  @override
  final String reportType;
  @override
  final String? description;
  @override
  final String status;
  @override
  final DateTime createdAt;

  FakeReport({
    this.id = 1,
    this.contentTypeName = 'post',
    this.reporterUsername = 'testuser',
    this.contentObjectPreview = 'Test content',
    this.reportType = 'spam',
    this.description,
    this.status = 'pending',
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();
}

/// Helper function to create a question report for testing
FakeReport getMockQuestionReport({
  int id = 1,
  String reporterUsername = 'testuser',
  String contentObjectPreview = 'Question: How to meal prep?',
  String reportType = 'spam',
  String? description,
  String status = 'pending',
}) {
  return FakeReport(
    id: id,
    contentTypeName: 'question',
    reporterUsername: reporterUsername,
    contentObjectPreview: contentObjectPreview,
    reportType: reportType,
    description: description,
    status: status,
  );
}

/// Helper function to create an answer report for testing
FakeReport getMockAnswerReport({
  int id = 1,
  String reporterUsername = 'testuser',
  String contentObjectPreview = 'Answer: Here is my advice...',
  String reportType = 'spam',
  String? description,
  String status = 'pending',
}) {
  return FakeReport(
    id: id,
    contentTypeName: 'answer',
    reporterUsername: reporterUsername,
    contentObjectPreview: contentObjectPreview,
    reportType: reportType,
    description: description,
    status: status,
  );
}

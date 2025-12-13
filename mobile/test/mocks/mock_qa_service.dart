import 'package:fithub/services/qa_service.dart';
import 'package:mocktail/mocktail.dart';

// A mock class for QAService using mocktail
class MockQAService extends Mock implements QAService {}

// Helper function to create a sample question for testing
Map<String, dynamic> getMockQuestion({
  int id = 1,
  String title = 'Test Question',
  String content = 'This is a test question content',
  String author = 'testuser',
  int authorId = 1,
  int viewCount = 0,
  int upvoteCount = 0,
  int downvoteCount = 0,
  List<String> tags = const ['Budget', 'Healthy'],
  bool isCommentable = true,
  String? createdAt,
  String? updatedAt,
}) {
  return {
    'id': id,
    'title': title,
    'content': content,
    'author': author,
    'author_id': authorId,
    'view_count': viewCount,
    'upvote_count': upvoteCount,
    'downvote_count': downvoteCount,
    'tags': tags,
    'is_commentable': isCommentable,
    'created_at': createdAt ?? DateTime.now().toIso8601String(),
    'updated_at': updatedAt ?? DateTime.now().toIso8601String(),
    'deleted_on': null,
  };
}

// Helper function to create a sample answer for testing
Map<String, dynamic> getMockAnswer({
  int id = 1,
  String content = 'This is a test answer content',
  String author = 'dietitian_user',
  int authorId = 2,
  int upvoteCount = 0,
  int downvoteCount = 0,
  int reportedCount = 0,
  String? createdAt,
  String? updatedAt,
}) {
  return {
    'id': id,
    'content': content,
    'author': author,
    'author_id': authorId,
    'upvote_count': upvoteCount,
    'downvote_count': downvoteCount,
    'reported_count': reportedCount,
    'created_at': createdAt ?? DateTime.now().toIso8601String(),
    'updated_at': updatedAt ?? DateTime.now().toIso8601String(),
    'deleted_on': null,
  };
}

// Helper function to create paginated questions response
Map<String, dynamic> getMockQuestionsResponse({
  int count = 1,
  String? next,
  String? previous,
  List<Map<String, dynamic>>? results,
}) {
  return {
    'count': count,
    'next': next,
    'previous': previous,
    'results': results ?? [getMockQuestion()],
  };
}

// Helper function to create paginated answers response
Map<String, dynamic> getMockAnswersResponse({
  int count = 1,
  String? next,
  String? previous,
  List<Map<String, dynamic>>? results,
}) {
  return {
    'count': count,
    'next': next,
    'previous': previous,
    'results': results ?? [getMockAnswer()],
  };
}

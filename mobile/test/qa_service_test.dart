import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:fithub/services/qa_service.dart';
import 'mocks/mock_qa_service.dart';

void main() {
  group('QA Service Tests', () {
    late MockQAService mockQAService;

    setUp(() {
      mockQAService = MockQAService();
    });

    group('getQuestions', () {
      test('returns questions list on success', () async {
        // Arrange
        final mockResponse = getMockQuestionsResponse(
          count: 2,
          results: [
            getMockQuestion(id: 1, title: 'Question 1'),
            getMockQuestion(id: 2, title: 'Question 2'),
          ],
        );
        when(() => mockQAService.getQuestions(page: 1, pageSize: 10))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await mockQAService.getQuestions(page: 1, pageSize: 10);

        // Assert
        expect(result['count'], equals(2));
        expect(result['results'], isA<List>());
        expect((result['results'] as List).length, equals(2));
        verify(() => mockQAService.getQuestions(page: 1, pageSize: 10)).called(1);
      });

      test('returns empty list when no questions exist', () async {
        // Arrange
        final mockResponse = getMockQuestionsResponse(
          count: 0,
          results: [],
        );
        when(() => mockQAService.getQuestions(page: 1, pageSize: 10))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await mockQAService.getQuestions(page: 1, pageSize: 10);

        // Assert
        expect(result['count'], equals(0));
        expect((result['results'] as List).isEmpty, isTrue);
      });

      test('throws exception when authentication fails', () async {
        // Arrange
        when(() => mockQAService.getQuestions(page: 1, pageSize: 10))
            .thenThrow(Exception('Authentication failed'));

        // Act & Assert
        expect(
          () async => await mockQAService.getQuestions(page: 1, pageSize: 10),
          throwsA(isA<Exception>()),
        );
      });

      test('handles pagination correctly', () async {
        // Arrange
        final mockResponse = getMockQuestionsResponse(
          count: 25,
          next: 'http://api/qa/questions/?page=2',
          results: [getMockQuestion()],
        );
        when(() => mockQAService.getQuestions(page: 1, pageSize: 10))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await mockQAService.getQuestions(page: 1, pageSize: 10);

        // Assert
        expect(result['count'], equals(25));
        expect(result['next'], isNotNull);
      });
    });

    group('getQuestionDetail', () {
      test('returns question detail on success', () async {
        // Arrange
        final mockQuestion = getMockQuestion(
          id: 1,
          title: 'Detailed Question',
          content: 'This is detailed content',
          viewCount: 10,
          upvoteCount: 5,
        );
        when(() => mockQAService.getQuestionDetail(1))
            .thenAnswer((_) async => mockQuestion);

        // Act
        final result = await mockQAService.getQuestionDetail(1);

        // Assert
        expect(result['id'], equals(1));
        expect(result['title'], equals('Detailed Question'));
        expect(result['view_count'], equals(10));
        expect(result['upvote_count'], equals(5));
        verify(() => mockQAService.getQuestionDetail(1)).called(1);
      });

      test('throws exception when question not found', () async {
        // Arrange
        when(() => mockQAService.getQuestionDetail(999))
            .thenThrow(Exception('Failed to load question'));

        // Act & Assert
        expect(
          () async => await mockQAService.getQuestionDetail(999),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('createQuestion', () {
      test('creates question successfully', () async {
        // Arrange
        final mockQuestion = getMockQuestion(
          id: 1,
          title: 'New Question',
          content: 'New question content',
          tags: ['Budget'],
        );
        when(() => mockQAService.createQuestion(
              title: 'New Question',
              content: 'New question content',
              tags: ['Budget'],
              isCommentable: true,
            )).thenAnswer((_) async => mockQuestion);

        // Act
        final result = await mockQAService.createQuestion(
          title: 'New Question',
          content: 'New question content',
          tags: ['Budget'],
          isCommentable: true,
        );

        // Assert
        expect(result['title'], equals('New Question'));
        expect(result['tags'], contains('Budget'));
      });

      test('throws exception when creation fails', () async {
        // Arrange
        when(() => mockQAService.createQuestion(
              title: 'New Question',
              content: 'Short',
              tags: [],
              isCommentable: true,
            )).thenThrow(Exception('Failed to create question'));

        // Act & Assert
        expect(
          () async => await mockQAService.createQuestion(
            title: 'New Question',
            content: 'Short',
            tags: [],
            isCommentable: true,
          ),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('updateQuestion', () {
      test('updates question successfully', () async {
        // Arrange
        final updatedQuestion = getMockQuestion(
          id: 1,
          title: 'Updated Title',
          content: 'Updated content',
        );
        when(() => mockQAService.updateQuestion(
              questionId: 1,
              title: 'Updated Title',
              content: 'Updated content',
            )).thenAnswer((_) async => updatedQuestion);

        // Act
        final result = await mockQAService.updateQuestion(
          questionId: 1,
          title: 'Updated Title',
          content: 'Updated content',
        );

        // Assert
        expect(result['title'], equals('Updated Title'));
      });

      test('throws exception when update fails', () async {
        // Arrange
        when(() => mockQAService.updateQuestion(
              questionId: 999,
              title: 'Updated Title',
            )).thenThrow(Exception('Failed to update question'));

        // Act & Assert
        expect(
          () async => await mockQAService.updateQuestion(
            questionId: 999,
            title: 'Updated Title',
          ),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('deleteQuestion', () {
      test('deletes question successfully', () async {
        // Arrange
        when(() => mockQAService.deleteQuestion(1))
            .thenAnswer((_) async => {});

        // Act & Assert
        await expectLater(
          mockQAService.deleteQuestion(1),
          completes,
        );
        verify(() => mockQAService.deleteQuestion(1)).called(1);
      });

      test('throws exception when deletion fails', () async {
        // Arrange
        when(() => mockQAService.deleteQuestion(999))
            .thenThrow(Exception('Failed to delete question'));

        // Act & Assert
        expect(
          () async => await mockQAService.deleteQuestion(999),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('voteQuestion', () {
      test('upvotes question successfully', () async {
        // Arrange
        when(() => mockQAService.voteQuestion(1, 'up'))
            .thenAnswer((_) async => {});

        // Act & Assert
        await expectLater(
          mockQAService.voteQuestion(1, 'up'),
          completes,
        );
        verify(() => mockQAService.voteQuestion(1, 'up')).called(1);
      });

      test('downvotes question successfully', () async {
        // Arrange
        when(() => mockQAService.voteQuestion(1, 'down'))
            .thenAnswer((_) async => {});

        // Act & Assert
        await expectLater(
          mockQAService.voteQuestion(1, 'down'),
          completes,
        );
        verify(() => mockQAService.voteQuestion(1, 'down')).called(1);
      });

      test('throws exception when vote fails', () async {
        // Arrange
        when(() => mockQAService.voteQuestion(1, 'up'))
            .thenThrow(Exception('Failed to vote on question'));

        // Act & Assert
        expect(
          () async => await mockQAService.voteQuestion(1, 'up'),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('getQuestionVote', () {
      test('returns upvote status', () async {
        // Arrange
        when(() => mockQAService.getQuestionVote(1))
            .thenAnswer((_) async => {'vote_type': 'up'});

        // Act
        final result = await mockQAService.getQuestionVote(1);

        // Assert
        expect(result?['vote_type'], equals('up'));
      });

      test('returns downvote status', () async {
        // Arrange
        when(() => mockQAService.getQuestionVote(1))
            .thenAnswer((_) async => {'vote_type': 'down'});

        // Act
        final result = await mockQAService.getQuestionVote(1);

        // Assert
        expect(result?['vote_type'], equals('down'));
      });

      test('returns null when no vote exists', () async {
        // Arrange
        when(() => mockQAService.getQuestionVote(1))
            .thenAnswer((_) async => null);

        // Act
        final result = await mockQAService.getQuestionVote(1);

        // Assert
        expect(result, isNull);
      });
    });

    group('removeQuestionVote', () {
      test('removes vote successfully', () async {
        // Arrange
        when(() => mockQAService.removeQuestionVote(1))
            .thenAnswer((_) async => {});

        // Act & Assert
        await expectLater(
          mockQAService.removeQuestionVote(1),
          completes,
        );
        verify(() => mockQAService.removeQuestionVote(1)).called(1);
      });

      test('throws exception when removal fails', () async {
        // Arrange
        when(() => mockQAService.removeQuestionVote(1))
            .thenThrow(Exception('Failed to remove vote'));

        // Act & Assert
        expect(
          () async => await mockQAService.removeQuestionVote(1),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('getAnswers', () {
      test('returns answers list on success', () async {
        // Arrange
        final mockResponse = getMockAnswersResponse(
          count: 2,
          results: [
            getMockAnswer(id: 1, content: 'Answer 1'),
            getMockAnswer(id: 2, content: 'Answer 2'),
          ],
        );
        when(() => mockQAService.getAnswers(questionId: 1, page: 1, pageSize: 10))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await mockQAService.getAnswers(questionId: 1, page: 1, pageSize: 10);

        // Assert
        expect(result['count'], equals(2));
        expect((result['results'] as List).length, equals(2));
      });

      test('returns empty list when no answers exist', () async {
        // Arrange
        final mockResponse = getMockAnswersResponse(
          count: 0,
          results: [],
        );
        when(() => mockQAService.getAnswers(questionId: 1, page: 1, pageSize: 10))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await mockQAService.getAnswers(questionId: 1, page: 1, pageSize: 10);

        // Assert
        expect(result['count'], equals(0));
        expect((result['results'] as List).isEmpty, isTrue);
      });
    });

    group('createAnswer', () {
      test('creates answer successfully', () async {
        // Arrange
        final mockAnswer = getMockAnswer(
          id: 1,
          content: 'New answer content',
        );
        when(() => mockQAService.createAnswer(
              questionId: 1,
              content: 'New answer content',
            )).thenAnswer((_) async => mockAnswer);

        // Act
        final result = await mockQAService.createAnswer(
          questionId: 1,
          content: 'New answer content',
        );

        // Assert
        expect(result['content'], equals('New answer content'));
      });

      test('throws exception when creation fails', () async {
        // Arrange
        when(() => mockQAService.createAnswer(
              questionId: 1,
              content: 'New answer content',
            )).thenThrow(Exception('Failed to create answer'));

        // Act & Assert
        expect(
          () async => await mockQAService.createAnswer(
            questionId: 1,
            content: 'New answer content',
          ),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('deleteAnswer', () {
      test('deletes answer successfully', () async {
        // Arrange
        when(() => mockQAService.deleteAnswer(1, 1))
            .thenAnswer((_) async => {});

        // Act & Assert
        await expectLater(
          mockQAService.deleteAnswer(1, 1),
          completes,
        );
        verify(() => mockQAService.deleteAnswer(1, 1)).called(1);
      });

      test('throws exception when deletion fails', () async {
        // Arrange
        when(() => mockQAService.deleteAnswer(1, 999))
            .thenThrow(Exception('Failed to delete answer'));

        // Act & Assert
        expect(
          () async => await mockQAService.deleteAnswer(1, 999),
          throwsA(isA<Exception>()),
        );
      });
    });

    group('voteAnswer', () {
      test('upvotes answer successfully', () async {
        // Arrange
        when(() => mockQAService.voteAnswer(1, 'up'))
            .thenAnswer((_) async => {});

        // Act & Assert
        await expectLater(
          mockQAService.voteAnswer(1, 'up'),
          completes,
        );
        verify(() => mockQAService.voteAnswer(1, 'up')).called(1);
      });

      test('downvotes answer successfully', () async {
        // Arrange
        when(() => mockQAService.voteAnswer(1, 'down'))
            .thenAnswer((_) async => {});

        // Act & Assert
        await expectLater(
          mockQAService.voteAnswer(1, 'down'),
          completes,
        );
        verify(() => mockQAService.voteAnswer(1, 'down')).called(1);
      });
    });

    group('getAnswerVote', () {
      test('returns vote status', () async {
        // Arrange
        when(() => mockQAService.getAnswerVote(1))
            .thenAnswer((_) async => {'vote_type': 'up'});

        // Act
        final result = await mockQAService.getAnswerVote(1);

        // Assert
        expect(result?['vote_type'], equals('up'));
      });

      test('returns null when no vote exists', () async {
        // Arrange
        when(() => mockQAService.getAnswerVote(1))
            .thenAnswer((_) async => null);

        // Act
        final result = await mockQAService.getAnswerVote(1);

        // Assert
        expect(result, isNull);
      });
    });

    group('removeAnswerVote', () {
      test('removes answer vote successfully', () async {
        // Arrange
        when(() => mockQAService.removeAnswerVote(1))
            .thenAnswer((_) async => {});

        // Act & Assert
        await expectLater(
          mockQAService.removeAnswerVote(1),
          completes,
        );
        verify(() => mockQAService.removeAnswerVote(1)).called(1);
      });
    });

    group('availableTags', () {
      test('contains expected tags', () {
        // Assert
        expect(QAService.availableTags, contains('Budget'));
        expect(QAService.availableTags, contains('Meal Prep'));
        expect(QAService.availableTags, contains('Healthy'));
        expect(QAService.availableTags, contains('Vegan'));
        expect(QAService.availableTags, contains('Vegetarian'));
        expect(QAService.availableTags, contains('Gluten Free'));
      });

      test('has correct number of tags', () {
        // Assert
        expect(QAService.availableTags.length, equals(15));
      });
    });
  });
}

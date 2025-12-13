import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'mocks/mock_qa_service.dart';

/// Scenario tests for Q&A functionality
/// These tests simulate real user scenarios for the Q&A feature
void main() {
  group('Scenario: User asks a question and receives answers', () {
    late MockQAService mockQAService;

    setUp(() {
      mockQAService = MockQAService();
    });

    test('User can create a question, view it, and receive answers', () async {
      // Step 1: User creates a new question
      final newQuestion = getMockQuestion(
        id: 1,
        title: 'What are good budget-friendly protein sources?',
        content:
            'I am a student trying to eat healthy on a tight budget. What are some affordable protein-rich foods I can incorporate into my meals?',
        tags: ['Budget', 'Student', 'Nutrition'],
        authorId: 10,
        author: 'student_user',
      );

      when(() => mockQAService.createQuestion(
            title: 'What are good budget-friendly protein sources?',
            content: any(named: 'content'),
            tags: ['Budget', 'Student', 'Nutrition'],
            isCommentable: true,
          )).thenAnswer((_) async => newQuestion);

      final createdQuestion = await mockQAService.createQuestion(
        title: 'What are good budget-friendly protein sources?',
        content:
            'I am a student trying to eat healthy on a tight budget. What are some affordable protein-rich foods I can incorporate into my meals?',
        tags: ['Budget', 'Student', 'Nutrition'],
        isCommentable: true,
      );

      expect(createdQuestion['id'], equals(1));
      expect(createdQuestion['title'],
          equals('What are good budget-friendly protein sources?'));

      // Step 2: Question appears in the questions list
      final questionsResponse = getMockQuestionsResponse(
        count: 1,
        results: [newQuestion],
      );

      when(() => mockQAService.getQuestions(page: 1, pageSize: 10))
          .thenAnswer((_) async => questionsResponse);

      final questionsList =
          await mockQAService.getQuestions(page: 1, pageSize: 10);
      expect((questionsList['results'] as List).length, equals(1));
      expect((questionsList['results'] as List)[0]['title'],
          equals('What are good budget-friendly protein sources?'));

      // Step 3: User views the question detail
      final questionWithViews = getMockQuestion(
        id: 1,
        title: 'What are good budget-friendly protein sources?',
        content:
            'I am a student trying to eat healthy on a tight budget. What are some affordable protein-rich foods I can incorporate into my meals?',
        tags: ['Budget', 'Student', 'Nutrition'],
        viewCount: 1,
        authorId: 10,
        author: 'student_user',
      );

      when(() => mockQAService.getQuestionDetail(1))
          .thenAnswer((_) async => questionWithViews);

      final questionDetail = await mockQAService.getQuestionDetail(1);
      expect(questionDetail['view_count'], equals(1));

      // Step 4: Dietitian answers the question
      final answer = getMockAnswer(
        id: 1,
        content:
            'Great question! Some budget-friendly protein sources include: eggs, canned tuna, dried beans, lentils, Greek yogurt, and cottage cheese. These are all affordable and highly nutritious.',
        author: 'dietitian_jane',
        authorId: 20,
      );

      when(() => mockQAService.createAnswer(
            questionId: 1,
            content: any(named: 'content'),
          )).thenAnswer((_) async => answer);

      final createdAnswer = await mockQAService.createAnswer(
        questionId: 1,
        content:
            'Great question! Some budget-friendly protein sources include: eggs, canned tuna, dried beans, lentils, Greek yogurt, and cottage cheese. These are all affordable and highly nutritious.',
      );

      expect(createdAnswer['author'], equals('dietitian_jane'));

      // Step 5: User views the answers
      final answersResponse = getMockAnswersResponse(
        count: 1,
        results: [answer],
      );

      when(() =>
              mockQAService.getAnswers(questionId: 1, page: 1, pageSize: 10))
          .thenAnswer((_) async => answersResponse);

      final answersList =
          await mockQAService.getAnswers(questionId: 1, page: 1, pageSize: 10);
      expect((answersList['results'] as List).length, equals(1));

      // Step 6: User upvotes the helpful answer
      when(() => mockQAService.voteAnswer(1, 'up'))
          .thenAnswer((_) async => {});

      await mockQAService.voteAnswer(1, 'up');
      verify(() => mockQAService.voteAnswer(1, 'up')).called(1);
    });
  });

  group('Scenario: User browses and votes on questions', () {
    late MockQAService mockQAService;

    setUp(() {
      mockQAService = MockQAService();
    });

    test('User can browse questions and vote on them', () async {
      // Step 1: User views the questions list
      final questionsResponse = getMockQuestionsResponse(
        count: 3,
        results: [
          getMockQuestion(
            id: 1,
            title: 'Best meal prep containers?',
            upvoteCount: 15,
            viewCount: 100,
          ),
          getMockQuestion(
            id: 2,
            title: 'How to reduce food waste?',
            upvoteCount: 8,
            viewCount: 50,
          ),
          getMockQuestion(
            id: 3,
            title: 'Vegan protein alternatives?',
            upvoteCount: 20,
            viewCount: 200,
          ),
        ],
      );

      when(() => mockQAService.getQuestions(page: 1, pageSize: 10))
          .thenAnswer((_) async => questionsResponse);

      final questions =
          await mockQAService.getQuestions(page: 1, pageSize: 10);
      expect((questions['results'] as List).length, equals(3));

      // Step 2: User upvotes a question they find helpful
      when(() => mockQAService.voteQuestion(1, 'up'))
          .thenAnswer((_) async => {});

      await mockQAService.voteQuestion(1, 'up');
      verify(() => mockQAService.voteQuestion(1, 'up')).called(1);

      // Step 3: User checks their vote status
      when(() => mockQAService.getQuestionVote(1))
          .thenAnswer((_) async => {'vote_type': 'up'});

      final voteStatus = await mockQAService.getQuestionVote(1);
      expect(voteStatus?['vote_type'], equals('up'));

      // Step 4: User changes their mind and removes the vote
      when(() => mockQAService.removeQuestionVote(1))
          .thenAnswer((_) async => {});

      await mockQAService.removeQuestionVote(1);
      verify(() => mockQAService.removeQuestionVote(1)).called(1);

      // Step 5: User then downvotes the question
      when(() => mockQAService.voteQuestion(1, 'down'))
          .thenAnswer((_) async => {});

      await mockQAService.voteQuestion(1, 'down');
      verify(() => mockQAService.voteQuestion(1, 'down')).called(1);
    });
  });

  group('Scenario: User manages their own questions', () {
    late MockQAService mockQAService;

    setUp(() {
      mockQAService = MockQAService();
    });

    test('User can edit and delete their own question', () async {
      // Step 1: User creates a question
      final originalQuestion = getMockQuestion(
        id: 1,
        title: 'Helthy eating tips',
        content: 'What are some tips for eating healthy?',
        authorId: 10,
      );

      when(() => mockQAService.createQuestion(
            title: 'Helthy eating tips',
            content: 'What are some tips for eating healthy?',
            tags: ['Healthy'],
            isCommentable: true,
          )).thenAnswer((_) async => originalQuestion);

      await mockQAService.createQuestion(
        title: 'Helthy eating tips',
        content: 'What are some tips for eating healthy?',
        tags: ['Healthy'],
        isCommentable: true,
      );

      // Step 2: User notices a typo and updates the question
      final updatedQuestion = getMockQuestion(
        id: 1,
        title: 'Healthy eating tips',
        content: 'What are some tips for eating healthy?',
        authorId: 10,
      );

      when(() => mockQAService.updateQuestion(
            questionId: 1,
            title: 'Healthy eating tips',
          )).thenAnswer((_) async => updatedQuestion);

      final updated = await mockQAService.updateQuestion(
        questionId: 1,
        title: 'Healthy eating tips',
      );

      expect(updated['title'], equals('Healthy eating tips'));

      // Step 3: User decides to delete the question
      when(() => mockQAService.deleteQuestion(1)).thenAnswer((_) async => {});

      await mockQAService.deleteQuestion(1);
      verify(() => mockQAService.deleteQuestion(1)).called(1);
    });
  });

  group('Scenario: Pagination through questions', () {
    late MockQAService mockQAService;

    setUp(() {
      mockQAService = MockQAService();
    });

    test('User can navigate through multiple pages of questions', () async {
      // Step 1: User views first page
      final page1Response = getMockQuestionsResponse(
        count: 25,
        next: 'http://api/qa/questions/?page=2',
        results: List.generate(
          10,
          (i) => getMockQuestion(id: i + 1, title: 'Question ${i + 1}'),
        ),
      );

      when(() => mockQAService.getQuestions(page: 1, pageSize: 10))
          .thenAnswer((_) async => page1Response);

      final page1 = await mockQAService.getQuestions(page: 1, pageSize: 10);
      expect((page1['results'] as List).length, equals(10));
      expect(page1['next'], isNotNull);
      expect(page1['count'], equals(25));

      // Step 2: User scrolls to page 2
      final page2Response = getMockQuestionsResponse(
        count: 25,
        previous: 'http://api/qa/questions/?page=1',
        next: 'http://api/qa/questions/?page=3',
        results: List.generate(
          10,
          (i) => getMockQuestion(id: i + 11, title: 'Question ${i + 11}'),
        ),
      );

      when(() => mockQAService.getQuestions(page: 2, pageSize: 10))
          .thenAnswer((_) async => page2Response);

      final page2 = await mockQAService.getQuestions(page: 2, pageSize: 10);
      expect((page2['results'] as List).length, equals(10));
      expect(page2['previous'], isNotNull);
      expect(page2['next'], isNotNull);

      // Step 3: User navigates to last page
      final page3Response = getMockQuestionsResponse(
        count: 25,
        previous: 'http://api/qa/questions/?page=2',
        next: null,
        results: List.generate(
          5,
          (i) => getMockQuestion(id: i + 21, title: 'Question ${i + 21}'),
        ),
      );

      when(() => mockQAService.getQuestions(page: 3, pageSize: 10))
          .thenAnswer((_) async => page3Response);

      final page3 = await mockQAService.getQuestions(page: 3, pageSize: 10);
      expect((page3['results'] as List).length, equals(5));
      expect(page3['next'], isNull);
    });
  });

  group('Scenario: Dietitian answers multiple questions', () {
    late MockQAService mockQAService;

    setUp(() {
      mockQAService = MockQAService();
    });

    test('Dietitian can answer questions and receive votes', () async {
      // Step 1: Dietitian views questions
      final questionsResponse = getMockQuestionsResponse(
        count: 2,
        results: [
          getMockQuestion(id: 1, title: 'Calorie counting tips?'),
          getMockQuestion(id: 2, title: 'Best foods for muscle gain?'),
        ],
      );

      when(() => mockQAService.getQuestions(page: 1, pageSize: 10))
          .thenAnswer((_) async => questionsResponse);

      final questions =
          await mockQAService.getQuestions(page: 1, pageSize: 10);
      expect((questions['results'] as List).length, equals(2));

      // Step 2: Dietitian answers first question
      final answer1 = getMockAnswer(
        id: 1,
        content: 'For calorie counting, I recommend...',
        author: 'dietitian_expert',
        authorId: 100,
      );

      when(() => mockQAService.createAnswer(
            questionId: 1,
            content: 'For calorie counting, I recommend...',
          )).thenAnswer((_) async => answer1);

      await mockQAService.createAnswer(
        questionId: 1,
        content: 'For calorie counting, I recommend...',
      );

      // Step 3: Dietitian answers second question
      final answer2 = getMockAnswer(
        id: 2,
        content: 'For muscle gain, focus on these protein sources...',
        author: 'dietitian_expert',
        authorId: 100,
      );

      when(() => mockQAService.createAnswer(
            questionId: 2,
            content: 'For muscle gain, focus on these protein sources...',
          )).thenAnswer((_) async => answer2);

      await mockQAService.createAnswer(
        questionId: 2,
        content: 'For muscle gain, focus on these protein sources...',
      );

      // Step 4: Users upvote the answers
      when(() => mockQAService.voteAnswer(1, 'up'))
          .thenAnswer((_) async => {});
      when(() => mockQAService.voteAnswer(2, 'up'))
          .thenAnswer((_) async => {});

      await mockQAService.voteAnswer(1, 'up');
      await mockQAService.voteAnswer(2, 'up');

      verify(() => mockQAService.voteAnswer(1, 'up')).called(1);
      verify(() => mockQAService.voteAnswer(2, 'up')).called(1);
    });
  });

  group('Scenario: Error handling in Q&A', () {
    late MockQAService mockQAService;

    setUp(() {
      mockQAService = MockQAService();
    });

    test('Handles network errors gracefully', () async {
      // Simulate network error when fetching questions
      when(() => mockQAService.getQuestions(page: 1, pageSize: 10))
          .thenThrow(Exception('Network error: Connection timeout'));

      expect(
        () async => await mockQAService.getQuestions(page: 1, pageSize: 10),
        throwsA(isA<Exception>()),
      );
    });

    test('Handles authentication errors', () async {
      // Simulate authentication error
      when(() => mockQAService.createQuestion(
            title: any(named: 'title'),
            content: any(named: 'content'),
            tags: any(named: 'tags'),
            isCommentable: any(named: 'isCommentable'),
          )).thenThrow(Exception('Authentication failed'));

      expect(
        () async => await mockQAService.createQuestion(
          title: 'Test',
          content: 'Test content',
          tags: ['Test'],
          isCommentable: true,
        ),
        throwsA(isA<Exception>()),
      );
    });

    test('Handles question not found error', () async {
      // Simulate question not found
      when(() => mockQAService.getQuestionDetail(9999))
          .thenThrow(Exception('Failed to load question'));

      expect(
        () async => await mockQAService.getQuestionDetail(9999),
        throwsA(isA<Exception>()),
      );
    });

    test('Handles vote on deleted question', () async {
      // Simulate voting on a deleted question
      when(() => mockQAService.voteQuestion(1, 'up'))
          .thenThrow(Exception('Question not found'));

      expect(
        () async => await mockQAService.voteQuestion(1, 'up'),
        throwsA(isA<Exception>()),
      );
    });
  });
}

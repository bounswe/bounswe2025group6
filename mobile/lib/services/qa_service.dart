import 'dart:convert';
import 'package:http/http.dart' as http;
import 'storage_service.dart';
import '../models/question.dart';
import '../models/answer.dart';

class QAService {
  static const String baseUrl = String.fromEnvironment('API_URL', defaultValue: 'https://fithubmp.xyz:8000');
  String? token;

  QAService({this.token});

  Map<String, String> get headers {
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await StorageService.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await http.post(
        Uri.parse('$baseUrl/api/token/refresh/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refresh': refreshToken}),
      );

      if (response.statusCode == 200) {
        final tokenData = jsonDecode(response.body);
        token = tokenData['access'];
        await StorageService.saveJwtAccessToken(token!);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<String> _getUsername(int userId) async {
    if (userId == 0) return 'Unknown';
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/api/users/$userId/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(
          Uri.parse('$baseUrl/api/users/$userId/'),
          headers: headers,
        );
      }

      if (response.statusCode == 200) {
        final userData = jsonDecode(response.body);
        return userData['username'] ?? 'Unknown';
      }
      return 'Unknown';
    } catch (e) {
      return 'Unknown';
    }
  }

  // Get all questions with pagination
  Future<Map<String, dynamic>> getQuestions({
    int page = 1,
    int pageSize = 10,
  }) async {
    try {
      final url = '$baseUrl/qa/questions/?page=$page&page_size=$pageSize';
      print('QA Service: Fetching questions from: $url');

      var response = await http.get(Uri.parse(url), headers: headers);

      print('QA Service: Response status: ${response.statusCode}');
      print(
        'QA Service: Response body preview: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}',
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(Uri.parse(url), headers: headers);
      }

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final resultsList = data['results'] as List;
        final questions = await Future.wait(
          resultsList.map<Future<Map<String, dynamic>>>((question) async {
            final q = question as Map<String, dynamic>;
            final username = await _getUsername(q['author']);
            return {
              'id': q['id'],
              'title': q['title'],
              'content': q['content'],
              'is_commentable': q['is_commentable'] ?? true,
              'author': username,
              'author_id': q['author'],
              'view_count': q['view_count'] ?? 0,
              'upvote_count': q['upvote_count'] ?? 0,
              'downvote_count': q['downvote_count'] ?? 0,
              'tags': List<String>.from(q['tags'] ?? []),
              'created_at': q['created_at'],
              'updated_at': q['updated_at'],
              'deleted_on': q['deleted_on'],
            };
          }),
        );

        return {
          'count': data['count'],
          'next': data['next'],
          'previous': data['previous'],
          'results': questions,
        };
      } else {
        // Try to parse error as JSON, but if it fails, show the raw response
        try {
          final error = jsonDecode(response.body);
          throw Exception(error['detail'] ?? 'Failed to load questions');
        } catch (_) {
          throw Exception(
            'Failed to load questions. Status: ${response.statusCode}. Response: ${response.body.substring(0, response.body.length > 100 ? 100 : response.body.length)}',
          );
        }
      }
    } catch (e) {
      if (e.toString().contains('FormatException')) {
        throw Exception(
          'Invalid response from server. The endpoint might not exist or returned HTML instead of JSON.',
        );
      }
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Get question detail
  Future<Map<String, dynamic>> getQuestionDetail(int questionId) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/qa/questions/$questionId/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(
          Uri.parse('$baseUrl/qa/questions/$questionId/'),
          headers: headers,
        );
      }

      if (response.statusCode == 200) {
        final question = jsonDecode(response.body);
        final username = await _getUsername(question['author']);
        return {
          'id': question['id'],
          'title': question['title'],
          'content': question['content'],
          'is_commentable': question['is_commentable'] ?? true,
          'author': username,
          'author_id': question['author'],
          'view_count': question['view_count'] ?? 0,
          'upvote_count': question['upvote_count'] ?? 0,
          'downvote_count': question['downvote_count'] ?? 0,
          'tags': List<String>.from(question['tags'] ?? []),
          'created_at': question['created_at'],
          'updated_at': question['updated_at'],
          'deleted_on': question['deleted_on'],
        };
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to load question');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Create a new question
  Future<Map<String, dynamic>> createQuestion({
    required String title,
    required String content,
    required List<String> tags,
    bool isCommentable = true,
  }) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/qa/questions/'),
        headers: headers,
        body: jsonEncode({
          'title': title,
          'content': content,
          'tags': tags,
          'is_commentable': isCommentable,
        }),
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.post(
          Uri.parse('$baseUrl/qa/questions/'),
          headers: headers,
          body: jsonEncode({
            'title': title,
            'content': content,
            'tags': tags,
            'is_commentable': isCommentable,
          }),
        );
      }

      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to create question');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Update a question
  Future<Map<String, dynamic>> updateQuestion({
    required int questionId,
    String? title,
    String? content,
    List<String>? tags,
    bool? isCommentable,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (title != null) body['title'] = title;
      if (content != null) body['content'] = content;
      if (tags != null) body['tags'] = tags;
      if (isCommentable != null) body['is_commentable'] = isCommentable;

      var response = await http.put(
        Uri.parse('$baseUrl/qa/questions/$questionId/'),
        headers: headers,
        body: jsonEncode(body),
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.put(
          Uri.parse('$baseUrl/qa/questions/$questionId/'),
          headers: headers,
          body: jsonEncode(body),
        );
      }

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to update question');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Delete a question
  Future<void> deleteQuestion(int questionId) async {
    try {
      var response = await http.delete(
        Uri.parse('$baseUrl/qa/questions/$questionId/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.delete(
          Uri.parse('$baseUrl/qa/questions/$questionId/'),
          headers: headers,
        );
      }

      if (response.statusCode != 204) {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to delete question');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Vote on a question
  Future<void> voteQuestion(int questionId, String voteType) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/qa/question/$questionId/vote/'),
        headers: headers,
        body: jsonEncode({'vote_type': voteType}),
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.post(
          Uri.parse('$baseUrl/qa/question/$questionId/vote/'),
          headers: headers,
          body: jsonEncode({'vote_type': voteType}),
        );
      }

      if (response.statusCode != 201) {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to vote on question');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Get user's vote on a question
  Future<Map<String, dynamic>?> getQuestionVote(int questionId) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/qa/question/$questionId/vote/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(
          Uri.parse('$baseUrl/qa/question/$questionId/vote/'),
          headers: headers,
        );
      }

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 204) {
        return null;
      } else {
        throw Exception('Failed to get vote status');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Remove vote from a question
  Future<void> removeQuestionVote(int questionId) async {
    try {
      var response = await http.delete(
        Uri.parse('$baseUrl/qa/question/$questionId/vote/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.delete(
          Uri.parse('$baseUrl/qa/question/$questionId/vote/'),
          headers: headers,
        );
      }

      if (response.statusCode != 204) {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to remove vote');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Get answers for a question
  Future<Map<String, dynamic>> getAnswers({
    required int questionId,
    int page = 1,
    int pageSize = 10,
  }) async {
    try {
      var response = await http.get(
        Uri.parse(
          '$baseUrl/qa/questions/$questionId/answers/?page=$page&page_size=$pageSize',
        ),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(
          Uri.parse(
            '$baseUrl/qa/questions/$questionId/answers/?page=$page&page_size=$pageSize',
          ),
          headers: headers,
        );
      }

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final resultsList = data['results'] as List;
        final answers = await Future.wait(
          resultsList.map<Future<Map<String, dynamic>>>((answer) async {
            final a = answer as Map<String, dynamic>;
            final username = await _getUsername(a['author']);
            return {
              'id': a['id'],
              'content': a['content'],
              'author': username,
              'author_id': a['author'],
              'upvote_count': a['upvote_count'] ?? 0,
              'downvote_count': a['downvote_count'] ?? 0,
              'reported_count': a['reported_count'] ?? 0,
              'created_at': a['created_at'],
              'updated_at': a['updated_at'],
              'deleted_on': a['deleted_on'],
            };
          }),
        );

        return {
          'count': data['count'],
          'next': data['next'],
          'previous': data['previous'],
          'results': answers,
        };
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to load answers');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Create an answer
  Future<Map<String, dynamic>> createAnswer({
    required int questionId,
    required String content,
  }) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/qa/questions/$questionId/answers/'),
        headers: headers,
        body: jsonEncode({'content': content}),
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.post(
          Uri.parse('$baseUrl/qa/questions/$questionId/answers/'),
          headers: headers,
          body: jsonEncode({'content': content}),
        );
      }

      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to create answer');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Delete an answer
  Future<void> deleteAnswer(int questionId, int answerId) async {
    try {
      var response = await http.delete(
        Uri.parse('$baseUrl/qa/questions/$questionId/answers/$answerId/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.delete(
          Uri.parse('$baseUrl/qa/questions/$questionId/answers/$answerId/'),
          headers: headers,
        );
      }

      if (response.statusCode != 204) {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to delete answer');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Vote on an answer
  Future<void> voteAnswer(int answerId, String voteType) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/qa/answer/$answerId/vote/'),
        headers: headers,
        body: jsonEncode({'vote_type': voteType}),
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.post(
          Uri.parse('$baseUrl/qa/answer/$answerId/vote/'),
          headers: headers,
          body: jsonEncode({'vote_type': voteType}),
        );
      }

      if (response.statusCode != 201) {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to vote on answer');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Get user's vote on an answer
  Future<Map<String, dynamic>?> getAnswerVote(int answerId) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/qa/answer/$answerId/vote/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(
          Uri.parse('$baseUrl/qa/answer/$answerId/vote/'),
          headers: headers,
        );
      }

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 204) {
        return null;
      } else {
        throw Exception('Failed to get vote status');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Remove vote from an answer
  Future<void> removeAnswerVote(int answerId) async {
    try {
      var response = await http.delete(
        Uri.parse('$baseUrl/qa/answer/$answerId/vote/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.delete(
          Uri.parse('$baseUrl/qa/answer/$answerId/vote/'),
          headers: headers,
        );
      }

      if (response.statusCode != 204) {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to remove vote');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Available question tags
  static const List<String> availableTags = [
    'Budget',
    'Meal Prep',
    'Family',
    'No Waste',
    'Sustainability',
    'Tips',
    'Gluten Free',
    'Vegan',
    'Vegetarian',
    'Quick',
    'Healthy',
    'Student',
    'Nutrition',
    'Healthy Eating',
    'Snacks',
  ];
}

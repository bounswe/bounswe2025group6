import 'dart:convert';
import 'package:http/http.dart' as http;
import 'storage_service.dart';
import '../models/forum_comment.dart'; 

class CommunityService {
  static const String baseUrl = 'http://95.179.161.59:8000';
  String? token;

  CommunityService({this.token});

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
    // If userId is 0 (our default for parsing errors), return "Unknown" immediately
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

  Future<Map<String, dynamic>> getPosts({
    int page = 1,
    int pageSize = 10,
  }) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/forum/posts/?page=$page&page_size=$pageSize'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(
          Uri.parse('$baseUrl/forum/posts/?page=$page&page_size=$pageSize'),
          headers: headers,
        );
      }

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final posts = await Future.wait(
          data['results'].map<Future<Map<String, dynamic>>>((post) async {
            final username = await _getUsername(post['author']);
            return {
              'id': post['id'],
              'title': post['title'],
              'content': post['content'],
              'author': username,
              'author_id': post['author'],
              'upvote_count': post['upvote_count'] ?? 0,
              'downvote_count': post['downvote_count'] ?? 0,
              'view_count': post['view_count'] ?? 0,
              'tags': List<String>.from(post['tags'] ?? []),
              'created_at': post['created_at'],
              'updated_at': post['updated_at'],
            };
          }),
        );

        return {
          'count': data['count'],
          'next': data['next'],
          'previous': data['previous'],
          'results': posts,
        };
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to load posts');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> createPost({
    required String title,
    required String content,
    required List<String> tags,
    bool isCommentable = true,
  }) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/forum/posts/'),
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
          Uri.parse('$baseUrl/forum/posts/'),
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
        throw Exception(error['detail'] ?? 'Failed to create post');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> getPostDetail(int id) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/forum/posts/$id/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(
          Uri.parse('$baseUrl/forum/posts/$id/'),
          headers: headers,
        );
      }

      if (response.statusCode == 200) {
        final post = jsonDecode(response.body);
        final username = await _getUsername(post['author']);

        return {
          'id': post['id'],
          'title': post['title'],
          'content': post['content'],
          'author': username,
          'author_id': post['author'],
          'is_commentable': post['is_commentable'] ?? false,
          'upvote_count': post['upvote_count'] ?? 0,
          'downvote_count': post['downvote_count'] ?? 0,
          'view_count': post['view_count'] ?? 0,
          'tags': List<String>.from(post['tags'] ?? []),
          'created_at': post['created_at'],
          'updated_at': post['updated_at'],
          'deleted_on': post['deleted_on'],
        };
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to load post details');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<void> deletePost(int id) async {
    try {
      var response = await http.delete(
        Uri.parse('$baseUrl/forum/posts/$id/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.delete(
          Uri.parse('$baseUrl/forum/posts/$id/'),
          headers: headers,
        );
      }

      if (response.statusCode != 204) {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to delete post');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> updatePost({
    required int id,
    required String title,
    required String content,
    required List<String> tags,
    required bool isCommentable,
  }) async {
    try {
      var response = await http.put(
        Uri.parse('$baseUrl/forum/posts/$id/'),
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

        response = await http.put(
          Uri.parse('$baseUrl/forum/posts/$id/'),
          headers: headers,
          body: jsonEncode({
            'title': title,
            'content': content,
            'tags': tags,
            'is_commentable': isCommentable,
          }),
        );
      }

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to update post');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>?> getUserVote(int postId) async {
    try {
      var response = await http.get(
        Uri.parse('$baseUrl/forum/post/$postId/vote/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(
          Uri.parse('$baseUrl/forum/post/$postId/vote/'),
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

  Future<void> votePost(int postId, String voteType) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/forum/post/$postId/vote/'),
        headers: headers,
        body: jsonEncode({'vote_type': voteType}),
      );

      if (response.statusCode == 400) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Please login to vote');

        response = await http.post(
          Uri.parse('$baseUrl/forum/post/$postId/vote/'),
          headers: headers,
          body: jsonEncode({'vote_type': voteType}),
        );
      }

      switch (response.statusCode) {
        case 201:
          return;
        case 400:
          final error = jsonDecode(response.body);
          throw Exception(
            error['message'] ?? 'You have already voted on this post',
          );
        case 404:
          throw Exception('Post not found');
        default:
          throw Exception('Failed to vote. Please try again');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Network error. Please check your connection');
    }
  }

  Future<void> removeVote(int postId) async {
    try {
      var response = await http.delete(
        Uri.parse('$baseUrl/forum/post/$postId/vote/'),
        headers: headers,
      );

      if (response.statusCode == 400) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess)
          throw Exception('Please login to remove your vote');

        response = await http.delete(
          Uri.parse('$baseUrl/forum/post/$postId/vote/'),
          headers: headers,
        );
      }

      switch (response.statusCode) {
        case 204:
          return;
        case 404:
          throw Exception('No vote found to remove');
        default:
          throw Exception('Failed to remove vote. Please try again');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Network error. Please check your connection');
    }
  }

  // --- Comment Methods ---

  // Helper function to safely parse int from dynamic value
  int _parseInt(dynamic value, int defaultValue) {
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? defaultValue;
    return defaultValue;
  }

  Future<Map<String, dynamic>> getComments(
    int postId, {
    int page = 1,
    int pageSize = 10,
  }) async {
    try {
      var response = await http.get(
        Uri.parse(
          '$baseUrl/forum/posts/$postId/comments/?page=$page&page_size=$pageSize',
        ),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(
          Uri.parse(
            '$baseUrl/forum/posts/$postId/comments/?page=$page&page_size=$pageSize',
          ),
          headers: headers,
        );
      }

      if (response.statusCode == 200) {
        final decodedResponse = jsonDecode(response.body);

        // Check if the decoded response is a List (e.g., empty list from backend)
        if (decodedResponse is List) {
          // If it's a list (likely empty), return a default structure
          return {'page': 1, 'page_size': pageSize, 'total': 0, 'results': []};
        }

        // If it's a Map, proceed as before
        final Map<String, dynamic> data =
            decodedResponse as Map<String, dynamic>;
        final resultsData = data['results']; // Get the results data

        // Ensure resultsData is actually a List before mapping
        final List<Map<String, dynamic>> comments;
        if (resultsData is List) {
          comments = await Future.wait(
            resultsData.map<Future<Map<String, dynamic>>>((comment) async {
              int authorId = 0; // Default to an invalid ID if parsing fails
              if (comment['author'] is int) {
                authorId = comment['author'];
              } else if (comment['author'] is String) {
                authorId = int.tryParse(comment['author'] as String) ?? 0;
              } else {
                // Log or handle cases where author is neither int nor String
                print(
                  'Warning: Unexpected type for comment author ID: ${comment['author']?.runtimeType}',
                );
              }

              final username = await _getUsername(authorId);
              // Explicitly cast comment to the correct type before spreading
              final Map<String, dynamic> typedComment =
                  Map<String, dynamic>.from(comment);
              return {
                ...typedComment, // Spread the explicitly typed map
                'author_username':
                    username, // Add username, will be 'Unknown' if authorId was invalid
              };
            }),
          );
        } else {
          // Handle cases where 'results' is not a list (e.g., null or wrong type)
          print(
            "Warning: 'results' field in API response is not a List or is null.",
          );
          comments = []; // Default to an empty list
        }

        return {
          'page': _parseInt(data['page'], 1),
          'page_size': _parseInt(data['page_size'], pageSize),
          'total': _parseInt(data['total'], 0),
          'results': comments, // Use the processed or empty list
        };
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to load comments');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<ForumComment> createComment(int postId, String content) async {
    try {
      var response = await http.post(
        Uri.parse('$baseUrl/forum/posts/$postId/comments/'),
        headers: headers,
        body: jsonEncode({'content': content}),
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.post(
          Uri.parse('$baseUrl/forum/posts/$postId/comments/'),
          headers: headers,
          body: jsonEncode({'content': content}),
        );
      }

      if (response.statusCode == 201) {
        return ForumComment.fromJson(jsonDecode(response.body));
      } else {
        final error = jsonDecode(response.body);
        if (response.statusCode == 403) {
          throw Exception(
            error['detail']?['non_field_errors']?.join(', ') ??
                'Cannot comment on this post.',
          );
        }
        throw Exception(error['detail'] ?? 'Failed to create comment');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<void> deleteComment(int postId, int commentId) async {
    try {
      var response = await http.delete(
        Uri.parse('$baseUrl/forum/posts/$postId/comments/$commentId/'),
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.delete(
          Uri.parse('$baseUrl/forum/posts/$postId/comments/$commentId/'),
          headers: headers,
        );
      }

      if (response.statusCode != 204) {
        // Handle potential 403 Forbidden if user is not the author
        if (response.statusCode == 403) {
          throw Exception('You do not have permission to delete this comment.');
        }
        final error = jsonDecode(response.body);
        throw Exception(error['detail'] ?? 'Failed to delete comment');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  Future<void> voteComment(int commentId, String voteType) async {
    try {
      var response = await http.post(
        Uri.parse(
          '$baseUrl/forum/comment/$commentId/vote/',
        ), // Corrected path (singular)
        headers: headers,
        body: jsonEncode({'vote_type': voteType}),
      );

      if (response.statusCode == 401) {
        // Changed from 400 to 401 for auth check
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Please login to vote');

        response = await http.post(
          Uri.parse(
            '$baseUrl/forum/comment/$commentId/vote/',
          ), // Corrected path (singular)
          headers: headers,
          body: jsonEncode({'vote_type': voteType}),
        );
      }

      switch (response.statusCode) {
        case 201:
          return;
        case 400:
          final error = jsonDecode(response.body);
          throw Exception(
            error['message'] ?? 'You have already voted on this comment',
          );
        case 404:
          throw Exception('Comment not found');
        default:
          throw Exception('Failed to vote on comment. Please try again');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Network error. Please check your connection');
    }
  }

  Future<void> removeCommentVote(int commentId) async {
    try {
      var response = await http.delete(
        Uri.parse(
          '$baseUrl/forum/comment/$commentId/vote/',
        ), // Corrected path (singular)
        headers: headers,
      );

      if (response.statusCode == 401) {
        // Changed from 400 to 401 for auth check
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess)
          throw Exception('Please login to remove your vote');

        response = await http.delete(
          Uri.parse(
            '$baseUrl/forum/comment/$commentId/vote/',
          ), // Corrected path (singular)
          headers: headers,
        );
      }

      switch (response.statusCode) {
        case 204:
          return;
        case 404:
          throw Exception('No vote found to remove for this comment');
        default:
          throw Exception('Failed to remove comment vote. Please try again');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Network error. Please check your connection');
    }
  }

  Future<Map<String, dynamic>?> getUserCommentVote(int commentId) async {
    try {
      var response = await http.get(
        Uri.parse(
          '$baseUrl/forum/comment/$commentId/vote/',
        ), // Corrected endpoint
        headers: headers,
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) throw Exception('Authentication failed');

        response = await http.get(
          Uri.parse(
            '$baseUrl/forum/comment/$commentId/vote/',
          ), // Corrected endpoint
          headers: headers,
        );
      }

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 204) {
        return null; // No vote found
      } else {
        throw Exception('Failed to get comment vote status');
      }
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }
}

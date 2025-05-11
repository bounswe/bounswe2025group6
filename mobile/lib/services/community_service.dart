import 'dart:convert';
import 'package:http/http.dart' as http;
import 'storage_service.dart';

class CommunityService {
  static const String baseUrl = 'http://10.0.2.2:8000';
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

  Future<Map<String, dynamic>> getPosts({int page = 1, int pageSize = 10}) async {
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
}
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'storage_service.dart';

class CommunityService {
  static const String baseUrl = 'http://10.0.2.2:8000';
  String? token;

  CommunityService({this.token});

  Map<String, String> get headers {
    final Map<String, String> headers = {
      'Content-Type': 'application/json',
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await StorageService.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await http.post(
        Uri.parse('$baseUrl/api/token/refresh/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'refresh': refreshToken,
        }),
      );

      if (response.statusCode == 201) {
        final tokenData = jsonDecode(response.body);
        // Update the access token
        token = tokenData['access'];
        // Save the new access token
        await StorageService.saveAccessToken(token!);
        return true;
      }

      // If refresh token is invalid or expired, return false
      return false;
    } catch (e) {
      return false;
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
        if (!refreshSuccess) {
          throw Exception('Authentication failed');
        }

        response = await http.get(
          Uri.parse('$baseUrl/forum/posts/?page=$page&page_size=$pageSize'),
          headers: headers,
        );
      }

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
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
        if (!refreshSuccess) {
          throw Exception('Authentication failed');
        }

        response = await http.post(
          Uri.parse('$baseUrl/forum/posts/'),
          headers: headers,
          body: jsonEncode({
            'title': title,
            'content': content,
            'tags': tags,
            'is_commandable': isCommentable,
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
        if (!refreshSuccess) {
          throw Exception('Authentication failed');
        }

        response = await http.get(
          Uri.parse('$baseUrl/forum/posts/$id/'),
          headers: headers,
        );
      }

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
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
        if (!refreshSuccess) {
          throw Exception('Authentication failed');
        }

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
}
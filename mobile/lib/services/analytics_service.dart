import 'dart:convert';
import 'package:http/http.dart' as http;

import 'storage_service.dart';
import '../models/analytics_model.dart';

class AnalyticsService {
  // Keep consistent with other services (see profile_service.dart) and include trailing segment for analytics
  static const String baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:8000');
  String? token;

  AnalyticsService({this.token});

  Map<String, String> get _headers {
    return {
      'Content-Type': 'application/json',
      if (token != null && token!.isNotEmpty) 'Authorization': 'Bearer $token',
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
    } catch (_) {
      return false;
    }
  }

  /// Fetch dashboard analytics.
  /// Tries with Authorization if available, but won't fail if user is not logged in
  /// unless the endpoint explicitly requires authentication.
  Future<Analytics> getAnalytics() async {
    token ??= await StorageService.getJwtAccessToken();

    // Correct endpoint: /analytics/analytics/ (provided by user)
    final uri = Uri.parse('$baseUrl/analytics/analytics/');
    var response = await http.get(uri, headers: _headers);
    // Debug log (can be removed later)
    // print('[AnalyticsService] GET ${uri.toString()} -> ${response.statusCode}');

    if (response.statusCode == 401) {
      final refreshed = await _refreshToken();
      if (refreshed) {
        response = await http.get(uri, headers: _headers);
      }
    }

    if (response.statusCode == 200) {
      try {
        final map = jsonDecode(response.body) as Map<String, dynamic>;
        return Analytics.fromJson(map);
      } catch (e) {
        throw Exception('Failed to parse analytics response: $e');
      }
    } else if (response.statusCode == 404) {
      throw Exception(
        'Analytics endpoint not found (404). Check backend route.',
      );
    } else if (response.statusCode == 401) {
      throw Exception('Unauthorized to fetch analytics (401).');
    }

    throw Exception(
      'Failed to load analytics (status: ${response.statusCode})',
    );
  }
}

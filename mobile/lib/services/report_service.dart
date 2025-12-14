import 'dart:convert';
import 'package:http/http.dart' as http;
import 'storage_service.dart';
import '../models/report.dart';

class ReportServiceException implements Exception {
  final String message;
  final int? statusCode;

  ReportServiceException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ReportService {
  static const String baseUrl = 'http://10.0.2.2:8000';
  String? token;

  ReportService({this.token});

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

  /// Create a new report for a post or recipe
  ///
  /// Throws [ReportServiceException] if the request fails
  Future<Report> createReport(CreateReportRequest request) async {
    token = await StorageService.getJwtAccessToken();
    if (token == null || token!.isEmpty) {
      throw ReportServiceException(
        'Authentication required. Please log in again.',
        statusCode: 401,
      );
    }

    try {
      var response = await http.post(
        Uri.parse('$baseUrl/reports/reports/'),
        headers: headers,
        body: jsonEncode(request.toJson()),
      );

      if (response.statusCode == 401) {
        final refreshSuccess = await _refreshToken();
        if (!refreshSuccess) {
          throw ReportServiceException(
            'Authentication failed. Please log in again.',
            statusCode: 401,
          );
        }

        response = await http.post(
          Uri.parse('$baseUrl/reports/reports/'),
          headers: headers,
          body: jsonEncode(request.toJson()),
        );
      }

      if (response.statusCode == 201) {
        try {
          final responseData = jsonDecode(response.body);
          // Debug: Print the response to help troubleshoot
          print('Report created successfully. Response: $responseData');
          return Report.fromJson(responseData);
        } catch (e) {
          print('Error parsing report response: $e');
          print('Response body: ${response.body}');
          throw ReportServiceException(
            'Failed to parse server response: ${e.toString()}',
            statusCode: 201,
          );
        }
      } else if (response.statusCode == 400) {
        final error = jsonDecode(response.body);
        String errorMessage = 'Invalid request. Please check your input.';

        // Parse specific error messages from the response
        if (error is Map) {
          List<String> errors = [];
          error.forEach((key, value) {
            if (value is List && value.isNotEmpty) {
              errors.add('$key: ${value.join(', ')}');
            } else if (value is String) {
              errors.add('$key: $value');
            }
          });
          if (errors.isNotEmpty) {
            errorMessage = errors.join('; ');
          }
        }

        throw ReportServiceException(errorMessage, statusCode: 400);
      } else if (response.statusCode == 404) {
        throw ReportServiceException(
          'The content you are trying to report was not found.',
          statusCode: 404,
        );
      } else {
        throw ReportServiceException(
          'Failed to create report. Please try again later.',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ReportServiceException) {
        rethrow;
      }
      throw ReportServiceException('Network error: ${e.toString()}');
    }
  }

  /// Helper method to report a post
  Future<Report> reportPost({
    required int postId,
    required ReportType reportType,
    String? description,
  }) async {
    final request = CreateReportRequest(
      contentType: ReportContentType.post,
      objectId: postId,
      reportType: reportType,
      description: description,
    );
    return createReport(request);
  }

  /// Helper method to report a recipe
  Future<Report> reportRecipe({
    required int recipeId,
    required ReportType reportType,
    String? description,
  }) async {
    final request = CreateReportRequest(
      contentType: ReportContentType.recipe,
      objectId: recipeId,
      reportType: reportType,
      description: description,
    );
    return createReport(request);
  }

  /// Helper method to report a post comment
  Future<Report> reportComment({
    required int commentId,
    required ReportType reportType,
    String? description,
  }) async {
    final request = CreateReportRequest(
      contentType: ReportContentType.postcomment,
      objectId: commentId,
      reportType: reportType,
      description: description,
    );
    return createReport(request);
  }

  /// Helper method to report a Q&A question
  Future<Report> reportQuestion({
    required int questionId,
    required ReportType reportType,
    String? description,
  }) async {
    final request = CreateReportRequest(
      contentType: ReportContentType.question,
      objectId: questionId,
      reportType: reportType,
      description: description,
    );
    return createReport(request);
  }

  /// Helper method to report a Q&A answer
  Future<Report> reportAnswer({
    required int answerId,
    required ReportType reportType,
    String? description,
  }) async {
    final request = CreateReportRequest(
      contentType: ReportContentType.answer,
      objectId: answerId,
      reportType: reportType,
      description: description,
    );
    return createReport(request);
  }
}

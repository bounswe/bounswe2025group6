import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/login_response.dart';

class AuthenticationException implements Exception {
  final String message;
  final int? statusCode;

  AuthenticationException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class AuthService {
  static const String baseUrl = 'http://10.0.2.2:8000/api';

  Future<LoginResponse> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      switch (response.statusCode) {
        case 200:
          return LoginResponse.fromJson(jsonDecode(response.body));
        case 400:
          throw AuthenticationException(
            'Invalid email or password.',
            statusCode: 400,
          );
        case 401:
          throw AuthenticationException(
            'Invalid credentials. Please check your email and password.',
            statusCode: 401,
          );
        default:
          throw AuthenticationException(
            'An error occurred. Please try again later.',
            statusCode: response.statusCode,
          );
      }
    } catch (e) {
      if (e is AuthenticationException) {
        rethrow;
      }
      throw AuthenticationException('Network error: ${e.toString()}');
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/forgot-password'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
        }),
      );

      switch (response.statusCode) {
        case 200:
          return; // Success, email sent
        case 400:
          throw AuthenticationException(
            'Invalid email address.',
            statusCode: 400,
          );
        default:
          throw AuthenticationException(
            'An error occurred. Please try again later.',
            statusCode: response.statusCode,
          );
      }
    } catch (e) {
      if (e is AuthenticationException) {
        rethrow;
      }
      throw AuthenticationException('Network error: ${e.toString()}');
    }
  }
}
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
        Uri.parse('$baseUrl/login/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
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
  } // End of login method

  Future<void> register({
    required String username,
    required String email,
    required String password,
    required String usertype,
    String? certificationUrl,
  }) async {
    try {
      Map<String, dynamic> requestBody = {
        'username': username,
        'email': email,
        'password': password,
        'usertype': usertype,
      };

      if (usertype == 'dietitian' &&
          certificationUrl != null &&
          certificationUrl.isNotEmpty) {
        requestBody['dietitian'] = {'certification_url': certificationUrl};
      }

      final response = await http.post(
        Uri.parse('$baseUrl/register/'), // Corrected endpoint
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(requestBody),
      );

      switch (response.statusCode) {
        case 201:
          // User registered successfully
          return;
        case 400:
          final responseBody = jsonDecode(response.body);
          String errorMessage = 'Registration failed. Please check your input.';
          if (responseBody is Map) {
            // Example: concatenate error messages from fields
            List<String> errors = [];
            responseBody.forEach((key, value) {
              if (value is List && value.isNotEmpty) {
                errors.add('$key: ${value.join(', ')}');
              } else if (value is String) {
                errors.add('$key: $value');
              }
            });
            if (errors.isNotEmpty) {
              errorMessage = errors.join('; ');
            } else if (responseBody.containsKey('detail')) {
              errorMessage = responseBody['detail'];
            }
          }
          throw AuthenticationException(errorMessage, statusCode: 400);
        default:
          throw AuthenticationException(
            'An error occurred during registration. Please try again later.',
            statusCode: response.statusCode,
          );
      }
    } catch (e) {
      if (e is AuthenticationException) {
        rethrow;
      }
      throw AuthenticationException(
        'Network error during registration: ${e.toString()}',
      );
    }
  } // End of register method

  Future<void> requestPasswordResetCode(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/request-password-reset-code/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      switch (response.statusCode) {
        case 200:
          return; // Success, code sent
        case 400:
          final responseBody = jsonDecode(response.body);
          if (responseBody['email'] != null) {
            throw AuthenticationException(
              responseBody['email'][0],
              statusCode: 400,
            );
          }
          throw AuthenticationException(
            'Invalid email address.',
            statusCode: 400,
          );
        case 500:
          final responseBody = jsonDecode(response.body);
          throw AuthenticationException(
            responseBody['detail'] ?? 'Server error occurred.',
            statusCode: 500,
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

  Future<void> verifyResetCode(String email, String resetCode) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/verify-reset-code/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'reset_code': resetCode,
        }),
      );

      switch (response.statusCode) {
        case 200:
          return; // Success, code verified
        case 400:
          final responseBody = jsonDecode(response.body);
          if (responseBody['reset_code'] != null) {
            throw AuthenticationException(
              responseBody['reset_code'][0],
              statusCode: 400,
            );
          }
          if (responseBody['email'] != null) {
            throw AuthenticationException(
              responseBody['email'][0],
              statusCode: 400,
            );
          }
          throw AuthenticationException(
            'Invalid verification attempt.',
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

  Future<void> logout(String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/logout/'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token $token',
        },
      );

      switch (response.statusCode) {
        case 200:
          return; // Successful logout
        case 400:
          throw AuthenticationException('Logout failed: No token found');
        case 401:
          throw AuthenticationException('Logout failed: User not authenticated');
        default:
          throw AuthenticationException(
            'An error occurred during logout. Please try again later.',
            statusCode: response.statusCode,
          );
      }
    } catch (e) {
      if (e is AuthenticationException) {
        rethrow;
      }
      throw AuthenticationException('Network error during logout: ${e.toString()}');
    }
  }
}

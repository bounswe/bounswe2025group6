import 'dart:convert';
import 'package:http/http.dart' as http;
import 'storage_service.dart';
import '../models/login_response.dart';

class AuthenticationException implements Exception {
  final String message;
  final int? statusCode;

  AuthenticationException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class AuthService {
  static const String baseUrl = 'https://fithubmp.xyz:8000';

  Future<LoginResponse> login(String email, String password) async {
    try {
      // First, authenticate user with login endpoint
      final loginResponse = await http.post(
        Uri.parse('$baseUrl/api/login/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      switch (loginResponse.statusCode) {
        case 200:
          final loginData = LoginResponse.fromJson(
            jsonDecode(loginResponse.body),
          );
          // Save token and userId
          await StorageService.saveJwtAccessToken(loginData.token);
          await StorageService.saveUserId(loginData.userId.toString());
          return loginData;
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
        case 429:
          throw AuthenticationException(
            'Too many failed login attempts. Please try again later.',
            statusCode: 429,
          );
        default:
          throw AuthenticationException(
            'An error occurred. Please try again later.',
            statusCode: loginResponse.statusCode,
          );
      }
    } catch (e) {
      throw Exception(e.toString());
    }
  }

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
        Uri.parse('$baseUrl/api/register/'),
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
        Uri.parse('$baseUrl/api/request-password-reset-code/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      if (response.statusCode != 200) {
        final error = jsonDecode(response.body);
        throw AuthenticationException(
          error['email']?[0] ?? error['detail'] ?? 'Failed to send reset code',
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

  Future<String> verifyResetCode(String email, String resetCode) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/verify-reset-code/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'code': resetCode}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return data['token'];
      } else {
        // Handle specific error messages from the API
        if (data.containsKey('non_field_errors')) {
          throw AuthenticationException(
            data['non_field_errors'][0],
            statusCode: response.statusCode,
          );
        } else if (data.containsKey('email')) {
          throw AuthenticationException(
            data['email'][0],
            statusCode: response.statusCode,
          );
        } else if (data.containsKey('code')) {
          throw AuthenticationException(
            data['code'][0],
            statusCode: response.statusCode,
          );
        }
        // Default error message
        throw AuthenticationException(
          data['detail'] ?? 'Invalid or expired code',
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

  Future<void> resetPassword(String token, String newPassword) async {
    if (newPassword.length < 8) {
      throw AuthenticationException('Password must be at least 8 characters.');
    }
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/reset-password/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'token': token, 'new_password': newPassword}),
      );

      if (response.statusCode != 200) {
        final error = jsonDecode(response.body);
        throw AuthenticationException(
          error['non_field_errors']?[0] ?? 'Failed to reset password',
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
        Uri.parse('$baseUrl/api/logout/'),
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
          throw AuthenticationException(
            'Logout failed: User not authenticated',
          );
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
      throw AuthenticationException(
        'Network error during logout: ${e.toString()}',
      );
    }
  }

  // New method to get JWT access token
  Future<Map<String, String>> getJwtAccessToken(
    String email,
    String password,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/token/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final responseBody = jsonDecode(response.body);
        if (responseBody['access'] != null && responseBody['refresh'] != null) {
          return {
            'access': responseBody['access'],
            'refresh': responseBody['refresh'],
          };
        } else {
          throw AuthenticationException(
            'Invalid JWT response format.',
            statusCode: response.statusCode,
          );
        }
      } else {
        String errorMessage = 'Failed to obtain JWT tokens.';
        try {
          final errorBody = jsonDecode(response.body);
          if (errorBody['detail'] != null) {
            errorMessage = errorBody['detail'];
          }
        } catch (_) {
          errorMessage =
              'Failed to obtain JWT tokens (status ${response.statusCode})';
        }
        throw AuthenticationException(
          errorMessage,
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is AuthenticationException) {
        rethrow;
      }
      throw AuthenticationException(
        'Network error while obtaining JWT tokens: ${e.toString()}',
      );
    }
  }
}

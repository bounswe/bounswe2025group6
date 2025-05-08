import 'dart:async';
import 'package:mockito/mockito.dart';
import 'package:fithub/services/auth_service.dart';
import 'package:fithub/models/login_response.dart';

class MockAuthService extends Fake implements AuthService {
  Future<void>? _forgotPasswordResponse;
  Completer<LoginResponse>? _loginCompleter;
  dynamic _registerResponse; // Can be success (void) or an Exception

  void setForgotPasswordResponse(Future<void> response) {
    _forgotPasswordResponse = response;
  }

  void setLoginResponse(Completer<LoginResponse> completer) {
    _loginCompleter = completer;
  }

  void setRegisterResponse(dynamic response) {
    _registerResponse = response;
  }

  @override
  Future<LoginResponse> login(String email, String password) async {
    if (_loginCompleter != null) {
      return await _loginCompleter!.future;
    }

    await Future.delayed(const Duration(milliseconds: 300));

    if (email == 'test@example.com' && password == 'password123') {
      return LoginResponse(email: email, token: 'mock_token');
    }
    throw AuthenticationException('Invalid credentials');
  }

  
  Future<void> forgotPassword(String email) async {
    if (_forgotPasswordResponse != null) {
      return await _forgotPasswordResponse!;
    }

    await Future.delayed(const Duration(milliseconds: 500));

    if (email != 'test@example.com') {
      throw AuthenticationException('Invalid email address.');
    }
  }

  @override
  Future<void> register({
    required String username,
    required String email,
    required String password,
    required String usertype,
    String? certificationUrl,
  }) async {
    await Future.delayed(
      const Duration(milliseconds: 100),
    ); // Short delay to simulate network
    if (_registerResponse != null) {
      if (_registerResponse is Exception) {
        throw _registerResponse;
      }
      return;
    }
    if (email == 'existing@example.com') {
      throw AuthenticationException('Email already in use by default mock.');
    }
  }

  @override
  Future<void> requestPasswordResetCode(String email) async {
    await Future.delayed(const Duration(milliseconds: 100));
    if (email != 'test@example.com') {
      throw AuthenticationException('This email address is not registered.');
    }
  }

  @override
  Future<String> verifyResetCode(String email, String resetCode) async {
    await Future.delayed(const Duration(milliseconds: 100));
    if (resetCode != '123456') {
      throw AuthenticationException('Invalid reset code.');
    }
    return 'mock-verification-token';
  }

  @override
  Future<void> resetPassword(String email, String password) async {
    await Future.delayed(const Duration(milliseconds: 100));
    
    if (email != 'test@example.com') {
      throw AuthenticationException('Email address not registered.');
    }
    
    if (password.length < 6) {
      throw AuthenticationException('Password must be at least 6 characters.');
    }
  }
}

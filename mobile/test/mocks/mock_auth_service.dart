import 'dart:async';
import 'package:mockito/mockito.dart';
import 'package:fithub/services/auth_service.dart';
import 'package:fithub/models/login_response.dart';

class MockAuthService extends Fake implements AuthService {
  Future<void>? _forgotPasswordResponse;
  Completer<LoginResponse>? _loginCompleter;

  void setForgotPasswordResponse(Future<void> response) {
    _forgotPasswordResponse = response;
  }

  void setLoginResponse(Completer<LoginResponse> completer) {
    _loginCompleter = completer;
  }

  @override
  Future<LoginResponse> login(String email, String password) async {
    if (_loginCompleter != null) {
      return await _loginCompleter!.future;
    }
    
    await Future.delayed(const Duration(milliseconds: 300));
    
    if (email == 'test@example.com' && password == 'password123') {
      return LoginResponse(
        email: email,
        token: 'mock_token',
      );
    }
    throw AuthenticationException('Invalid credentials');
  }

  @override
  Future<void> forgotPassword(String email) async {
    if (_forgotPasswordResponse != null) {
      return await _forgotPasswordResponse!;
    }

    await Future.delayed(const Duration(milliseconds: 500));
    
    if (email != 'test@example.com') {
      throw AuthenticationException('Invalid email address.');
    }
  }
}
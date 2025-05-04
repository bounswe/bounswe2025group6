class LoginResponse {
  final String email;
  final String token;

  LoginResponse({
    required this.email,
    required this.token,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      email: json['email'] as String,
      token: json['token'] as String,
    );
  }
}
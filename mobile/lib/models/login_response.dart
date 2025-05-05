class LoginResponse {
  final String email;
  final String token;

  LoginResponse({
    required this.email,
    required this.token,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    final email = json['email'];
    final token = json['token'];

    if (email == null || token == null) {
      final missing = [
        if (email == null) 'email',
        if (token == null) 'token',
      ].join(', ');
      throw FormatException('Missing required fields: $missing');
    }

    return LoginResponse(
      email: email as String,
      token: token as String,
    );
  }
}
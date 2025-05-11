class LoginResponse {
  final String email;
  final String token;
  final int userId;
  final String usertype;

  LoginResponse({
    required this.email,
    required this.token,
    required this.userId,
    required this.usertype,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    final email = json['email'];
    final token = json['token'];
    final userId = json['user_id'];
    final usertype = json['usertype'];

    if (email == null || token == null || userId == null || usertype == null) {
      final missing = [
        if (email == null) 'email',
        if (token == null) 'token',
        if (userId == null) 'user_id',
        if (usertype == null) 'usertype',
      ].join(', ');
      throw FormatException('Missing required fields: $missing');
    }

    return LoginResponse(
      email: email as String,
      token: token as String,
      userId: userId as int,
      usertype: usertype as String,
    );
  }
}

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  static const _storage = FlutterSecureStorage();
  static const _jwtAccessTokenKey = 'jwt_access_token'; // For JWT access token
  static const _userIdKey = 'user_id';
  static const _refreshTokenKey = 'refresh_token';

  static Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  static Future<void> deleteTokens() async {
    await _storage.delete(key: _jwtAccessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }

  static Future<void> saveUserId(String userId) async {
    await _storage.write(key: _userIdKey, value: userId);
  }

  static Future<String?> getUserId() async {
    return await _storage.read(key: _userIdKey);
  }

  static Future<void> deleteUserId() async {
    await _storage.delete(key: _userIdKey);
  }

  // Helper to delete all user-specific data on logout
  static Future<void> deleteAllUserData() async {
    await deleteTokens();
    await deleteUserId();
  }

  // Methods for JWT Access Token
  static Future<void> saveJwtAccessToken(String jwtToken) async {
    await _storage.write(key: _jwtAccessTokenKey, value: jwtToken);
  }

  static Future<String?> getJwtAccessToken() async {
    return await _storage.read(key: _jwtAccessTokenKey);
  }

  static Future<void> deleteJwtAccessToken() async {
    await _storage.delete(key: _jwtAccessTokenKey);
  }
}
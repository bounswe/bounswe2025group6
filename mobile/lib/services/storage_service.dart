import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token'; // For the original Django token
  static const _jwtAccessTokenKey = 'jwt_access_token'; // For JWT access token
  static const _userIdKey = 'user_id';

  static Future<void> saveAccessToken(String token) async {
    await _storage.write(key: _accessTokenKey, value: token);
  }

  static Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  static Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  static Future<void> deleteTokens() async {
    await _storage.delete(key: _accessTokenKey);
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
    await deleteToken();
    await deleteJwtAccessToken(); // Also delete JWT token on logout
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

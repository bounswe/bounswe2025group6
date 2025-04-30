import 'package:flutter/material.dart';

class AppTheme {
  static const primaryGreen = Color(0xFF006837);
  static const buttonGrey = Color(0xFF4A4A4A);
  static const backgroundGrey = Color.fromARGB(255, 233, 232, 232);

  static ThemeData get lightTheme {
    return ThemeData(
      scaffoldBackgroundColor: backgroundGrey,
      primaryColor: primaryGreen,
      inputDecorationTheme: const InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        labelStyle: TextStyle(color: Colors.grey),
        border: OutlineInputBorder(),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: buttonGrey,
        ),
      ),
    );
  }
}
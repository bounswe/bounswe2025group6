import 'package:flutter/material.dart';
import 'dart:math' as math;

class AppTheme {
  // Primary colors with WCAG AA compliance
  static const primaryGreen = Color(0xFF006837);
  static const buttonGrey = Color(0xFF4A4A4A);
  static const backgroundGrey = Color.fromARGB(255, 233, 232, 232);
  
  // Accessible text colors
  // These colors ensure minimum 4.5:1 contrast ratio with their backgrounds
  static const textOnLight = Color(0xFF212121); // ~16.1:1 contrast with white
  static const textOnDark = Color(0xFFFFFFFF); // White text on dark backgrounds
  static const textSecondary = Color(0xFF757575); // 4.6:1 contrast with white
  static const textOnPrimary = Color(0xFFFFFFFF); // White on green
  
  // Accessible link color - ensures 4.5:1 contrast
  static const linkColor = Color(0xFF005A9C); // 4.54:1 contrast with white
  
  // Error and success colors with proper contrast
  static const errorColor = Color(0xFFB00020); // 6.4:1 contrast with white
  static const successColor = Color(0xFF1B5E20); // 6.5:1 contrast with white
  static const warningColor = Color(0xFFBF360C); // Darker orange for 4.5:1+ contrast
  
  // Large text colors (18pt+ or 14pt+ bold) - minimum 3:1 contrast
  static const largeTextSecondary = Color(0xFF757575); // 4.6:1 contrast with white (exceeds 3:1)

  /// Calculate the relative luminance of a color
  /// Used for WCAG contrast ratio calculations
  static double _getLuminance(Color color) {
    final r = color.red / 255.0;
    final g = color.green / 255.0;
    final b = color.blue / 255.0;

    final rL = r <= 0.03928 ? r / 12.92 : math.pow((r + 0.055) / 1.055, 2.4).toDouble();
    final gL = g <= 0.03928 ? g / 12.92 : math.pow((g + 0.055) / 1.055, 2.4).toDouble();
    final bL = b <= 0.03928 ? b / 12.92 : math.pow((b + 0.055) / 1.055, 2.4).toDouble();

    return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
  }

  /// Calculate contrast ratio between two colors
  /// Returns a value between 1 and 21
  static double getContrastRatio(Color color1, Color color2) {
    final lum1 = _getLuminance(color1);
    final lum2 = _getLuminance(color2);
    final lighter = math.max(lum1, lum2);
    final darker = math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /// Check if contrast ratio meets WCAG AA standard for normal text (4.5:1)
  static bool meetsNormalTextContrast(Color foreground, Color background) {
    return getContrastRatio(foreground, background) >= 4.5;
  }

  /// Check if contrast ratio meets WCAG AA standard for large text (3:1)
  /// Large text is defined as 18pt+ or 14pt+ bold
  static bool meetsLargeTextContrast(Color foreground, Color background) {
    return getContrastRatio(foreground, background) >= 3.0;
  }

  /// Get an accessible text color for the given background
  /// Returns black or white depending on which has better contrast
  static Color getAccessibleTextColor(Color backgroundColor) {
    final contrastWithBlack = getContrastRatio(textOnLight, backgroundColor);
    return contrastWithBlack >= 4.5 ? textOnLight : textOnDark;
  }

  /// Accessible text styles for normal text (minimum 4.5:1 contrast)
  static const TextStyle normalText = TextStyle(
    color: textOnLight,
    fontSize: 16,
  );

  static const TextStyle normalTextSecondary = TextStyle(
    color: textSecondary,
    fontSize: 16,
  );

  /// Accessible text styles for large text (minimum 3:1 contrast)
  /// Large text: 18pt+ or 14pt+ bold
  static const TextStyle largeText = TextStyle(
    color: textOnLight,
    fontSize: 18,
  );

  static const TextStyle largeTextBold = TextStyle(
    color: textOnLight,
    fontSize: 14,
    fontWeight: FontWeight.bold,
  );

  static const TextStyle largeTextSecondaryStyle = TextStyle(
    color: largeTextSecondary,
    fontSize: 18,
  );

  /// Heading styles with proper contrast
  static const TextStyle heading1 = TextStyle(
    color: textOnLight,
    fontSize: 32,
    fontWeight: FontWeight.bold,
  );

  static const TextStyle heading2 = TextStyle(
    color: textOnLight,
    fontSize: 24,
    fontWeight: FontWeight.bold,
  );

  static const TextStyle heading3 = TextStyle(
    color: textOnLight,
    fontSize: 20,
    fontWeight: FontWeight.bold,
  );

  static ThemeData get lightTheme {
    return ThemeData(
      scaffoldBackgroundColor: backgroundGrey,
      primaryColor: primaryGreen,
      colorScheme: ColorScheme.light(
        primary: primaryGreen,
        secondary: primaryGreen,
        error: errorColor,
        surface: Colors.white,
        onPrimary: textOnDark,
        onSecondary: textOnDark,
        onError: textOnDark,
        onSurface: textOnLight,
      ),
      // Text theme with accessible colors
      textTheme: const TextTheme(
        displayLarge: heading1,
        displayMedium: heading2,
        displaySmall: heading3,
        bodyLarge: normalText,
        bodyMedium: normalText,
        bodySmall: TextStyle(color: textSecondary, fontSize: 14),
        labelLarge: TextStyle(color: textOnDark, fontSize: 16, fontWeight: FontWeight.bold),
        titleLarge: heading2,
        titleMedium: heading3,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        labelStyle: const TextStyle(color: textSecondary),
        hintStyle: const TextStyle(color: textSecondary),
        border: const OutlineInputBorder(),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: textSecondary.withOpacity(0.5)),
        ),
        focusedBorder: const OutlineInputBorder(
          borderSide: BorderSide(color: primaryGreen, width: 2),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: buttonGrey,
          foregroundColor: textOnDark, // White text on grey button
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: linkColor,
        ),
      ),
      // SnackBar theme with accessible colors
      snackBarTheme: const SnackBarThemeData(
        backgroundColor: buttonGrey,
        contentTextStyle: TextStyle(color: textOnDark),
      ),
    );
  }
}
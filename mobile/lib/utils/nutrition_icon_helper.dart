import 'package:flutter/material.dart';

/// Helper class for dynamic nutrition value icons
/// Icons adapt based on nutrition type and value thresholds
class NutritionIconHelper {
  /// Calorie thresholds (total recipe)
  static const double _caloriesLow = 400;
  static const double _caloriesMedium = 800;
  static const double _caloriesHigh = 1500;

  /// Protein thresholds (grams, total recipe)
  static const double _proteinLow = 30;
  static const double _proteinMedium = 60;
  static const double _proteinHigh = 100;

  /// Fat thresholds (grams, total recipe)
  static const double _fatLow = 20;
  static const double _fatMedium = 50;
  static const double _fatHigh = 80;

  /// Carbs thresholds (grams, total recipe)
  static const double _carbsLow = 50;
  static const double _carbsMedium = 100;
  static const double _carbsHigh = 150;

  /// Get intensity level (0-3) based on value and type
  static int getIntensityLevel(String type, double value) {
    switch (type.toLowerCase()) {
      case 'calories':
        if (value <= _caloriesLow) return 1;
        if (value <= _caloriesMedium) return 2;
        if (value <= _caloriesHigh) return 3;
        return 4; // Very high
      case 'protein':
        if (value <= _proteinLow) return 1;
        if (value <= _proteinMedium) return 2;
        if (value <= _proteinHigh) return 3;
        return 4;
      case 'fat':
        if (value <= _fatLow) return 1;
        if (value <= _fatMedium) return 2;
        if (value <= _fatHigh) return 3;
        return 4;
      case 'carbs':
        if (value <= _carbsLow) return 1;
        if (value <= _carbsMedium) return 2;
        if (value <= _carbsHigh) return 3;
        return 4;
      default:
        return 1;
    }
  }

  /// Get emoji string based on nutrition type and value
  /// Limited to max 3 emojis to prevent overflow
  static String getEmoji(String type, double value) {
    if (value <= 0) return _getBaseEmoji(type);

    final level = getIntensityLevel(type, value);
    final baseEmoji = _getBaseEmoji(type);

    // Cap at 3 emojis to prevent overflow
    final emojiCount = level > 3 ? 3 : level;
    return baseEmoji * emojiCount;
  }

  /// Get a compact representation for high values (single emoji)
  static String getCompactEmoji(String type, double value) {
    // Always show single emoji for compact view
    return _getBaseEmoji(type);
  }

  /// Get base emoji for each nutrition type
  static String _getBaseEmoji(String type) {
    switch (type.toLowerCase()) {
      case 'calories':
        return '🔥';
      case 'protein':
        return '💪';
      case 'fat':
        return '🫒';
      case 'carbs':
        return '🌾';
      default:
        return '📊';
    }
  }

  /// Get dynamic color based on nutrition type and intensity
  static Color getColor(String type, double value) {
    final level = getIntensityLevel(type, value);

    switch (type.toLowerCase()) {
      case 'calories':
        // Orange → Red based on intensity
        switch (level) {
          case 1:
            return Colors.orange.shade300;
          case 2:
            return Colors.orange;
          case 3:
            return Colors.deepOrange;
          default:
            return Colors.red;
        }
      case 'protein':
        // Light red → Dark red based on intensity
        switch (level) {
          case 1:
            return Colors.red.shade200;
          case 2:
            return Colors.red.shade400;
          case 3:
            return Colors.red.shade600;
          default:
            return Colors.red.shade800;
        }
      case 'fat':
        // Light yellow → Amber based on intensity
        switch (level) {
          case 1:
            return Colors.yellow.shade400;
          case 2:
            return Colors.yellow.shade600;
          case 3:
            return Colors.amber;
          default:
            return Colors.amber.shade700;
        }
      case 'carbs':
        // Light green → Dark green based on intensity
        switch (level) {
          case 1:
            return Colors.green.shade300;
          case 2:
            return Colors.green;
          case 3:
            return Colors.green.shade600;
          default:
            return Colors.green.shade800;
        }
      default:
        return Colors.grey;
    }
  }

  /// Get icon size multiplier based on intensity
  static double getIconSizeMultiplier(String type, double value) {
    final level = getIntensityLevel(type, value);
    switch (level) {
      case 1:
        return 1.0;
      case 2:
        return 1.1;
      case 3:
        return 1.2;
      default:
        return 1.3;
    }
  }

  /// Get description text for the intensity level
  static String getIntensityLabel(
    String type,
    double value, {
    bool turkish = false,
  }) {
    final level = getIntensityLevel(type, value);

    if (turkish) {
      switch (level) {
        case 1:
          return 'Düşük';
        case 2:
          return 'Orta';
        case 3:
          return 'Yüksek';
        default:
          return 'Çok Yüksek';
      }
    }

    switch (level) {
      case 1:
        return 'Low';
      case 2:
        return 'Medium';
      case 3:
        return 'High';
      default:
        return 'Very High';
    }
  }

  /// Build a dynamic icon widget with animation potential
  static Widget buildDynamicIcon({
    required String type,
    required double value,
    double baseSize = 28,
    bool showEmoji = true,
  }) {
    final color = getColor(type, value);
    final sizeMultiplier = getIconSizeMultiplier(type, value);
    final icon = _getIconData(type);
    final emoji = getEmoji(type, value);
    final level = getIntensityLevel(type, value);

    if (showEmoji) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: baseSize * sizeMultiplier, color: color),
          if (level >= 2) ...[
            const SizedBox(width: 2),
            Text(emoji, style: TextStyle(fontSize: baseSize * 0.6)),
          ],
        ],
      );
    }

    return Icon(icon, size: baseSize * sizeMultiplier, color: color);
  }

  /// Get Material icon for nutrition type
  static IconData _getIconData(String type) {
    switch (type.toLowerCase()) {
      case 'calories':
        return Icons.local_fire_department;
      case 'protein':
        return Icons.fitness_center;
      case 'fat':
        return Icons.opacity;
      case 'carbs':
        return Icons.grass;
      default:
        return Icons.info;
    }
  }

  /// Parse value from dynamic input
  static double parseValue(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

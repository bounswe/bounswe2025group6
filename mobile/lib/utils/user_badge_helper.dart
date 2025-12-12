import 'package:flutter/material.dart';

/// Badge styling information
class BadgeStyle {
  final Color backgroundColor;
  final Color textColor;
  final Color borderColor;
  final IconData icon;

  const BadgeStyle({
    required this.backgroundColor,
    required this.textColor,
    required this.borderColor,
    required this.icon,
  });
}

/// Normalize badge values from user profile's typeOfCook field.
///
/// Expected API behavior (from /api/users/{id}/ endpoint):
/// - typeOfCook: null -> 'Cook' (basic cook)
/// - typeOfCook: 'home_cook' -> 'Home Cook'
/// - typeOfCook: 'experienced_home_cook' -> 'Experienced Home Cook'
/// - usertype: 'dietitian' -> 'Dietitian' (takes priority)
///
/// Allowed normalized values produced by this helper:
/// - 'dietitian' (takes priority when userType == 'dietitian')
/// - 'experienced_home_cook'
/// - 'home_cook'
/// - 'cook'
///
/// Dietitian user type always takes priority when provided via userType.
/// Returns a normalized badge key. These keys are used internally for styling
/// and localization. Callers should pass the returned key to `getBadgeStyle`
/// and the `BadgeWidget` will localize the displayed label.
String normalizeBadgeFromApi(String? typeOfCook, {String? userType}) {
  // Dietitian priority -> return key
  if (userType?.toLowerCase() == 'dietitian') return 'dietitian';

  // Handle null typeOfCook (basic cook)
  if (typeOfCook == null || typeOfCook.isEmpty) {
    return 'cook';
  }

  final raw = typeOfCook.toLowerCase();

  // Check for experienced_home_cook (exact match or contains)
  if (raw == 'experienced_home_cook' || raw.contains('experienced')) {
    return 'experienced_home_cook';
  }

  // Check for home_cook (exact match or contains)
  if (raw == 'home_cook' || raw.contains('home')) {
    return 'home_cook';
  }

  // Default fallback for any other value
  return 'cook';
}

/// Get badge styling based on badge name
BadgeStyle getBadgeStyle(String badgeKey) {
  final key = badgeKey.toLowerCase();

  if (key == 'experienced_home_cook' || key.contains('experienced')) {
    // Muted, natural yellow (soft/mustard-like)
    return const BadgeStyle(
      backgroundColor: Color(0xFFF2E8A7), // Soft mustard
      textColor: Color(0xFF5B3A00), // Dark brown for contrast
      borderColor: Color(0xFFC9B037), // Muted gold/brown
      icon: Icons.military_tech, // Medal/trophy for achievement
    );
  }

  if (key == 'dietitian') {
    return const BadgeStyle(
      backgroundColor: Color(0xFFE3F2FD), // Light blue
      textColor: Color(0xFF1565C0), // Dark blue
      borderColor: Color(0xFF1976D2), // Blue
      icon: Icons.verified,
    );
  }

  if (key == 'home_cook' || key.contains('home')) {
    // Natural, soft green (sage-like) for home cooks
    return const BadgeStyle(
      backgroundColor: Color(0xFFE6F4EA), // Soft sage/green
      textColor: Color(0xFF2E7D32), // Dark green for contrast
      borderColor: Color(0xFF81C784), // Muted green border
      icon: Icons.eco,
    );
  }

  // Default 'Cook'
  return const BadgeStyle(
    backgroundColor: Color(0xFFEEEEEE), // Light gray
    textColor: Color(0xFF424242), // Dark gray
    borderColor: Color(0xFF757575), // Medium gray
    icon: Icons.restaurant,
  );
}

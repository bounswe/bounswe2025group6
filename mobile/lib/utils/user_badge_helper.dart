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

/// Normalize badge values from API response to the allowed set.
/// Expected API behavior:
/// - recipe_count >= 20 -> 'Experienced Home Cook'
/// - recipe_count >= 5  -> 'Home Cook'
/// - otherwise -> 'Cook'
///
/// Allowed normalized values produced by this helper:
/// - 'Dietitian' (takes priority when userType == 'dietitian')
/// - 'Experienced Home Cook'
/// - 'Home Cook'
/// - 'Cook'
///
/// Dietitian user type always takes priority when provided via userType.
/// Returns a normalized badge key (one of: 'dietitian', 'experienced_home_cook',
/// 'home_cook', 'cook'). These keys are used internally for styling and
/// localization. Callers should pass the returned key to `getBadgeStyle`
/// and the `BadgeWidget` will localize the displayed label.
String normalizeBadgeFromApi(String? apiBadge, {String? userType}) {
  // Dietitian priority -> return key
  if (userType?.toLowerCase() == 'dietitian') return 'dietitian';

  final raw = (apiBadge ?? '').toLowerCase();

  if (raw.contains('experienced') || raw.contains('experienced home')) {
    return 'experienced_home_cook';
  }

  if (raw.contains('home') || raw.contains('home cook')) {
    return 'home_cook';
  }

  // Default fallback
  return 'cook';
}

/// Get badge styling based on badge name
BadgeStyle getBadgeStyle(String badgeKey) {
  final key = badgeKey.toLowerCase();

  if (key == 'experienced_home_cook' || key.contains('experienced')) {
    return const BadgeStyle(
      backgroundColor: Color(0xFFFFD700), // Gold
      textColor: Color(0xFF8B6914), // Dark gold
      borderColor: Color(0xFFB8860B), // Dark goldenrod
      icon: Icons.star,
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
    return const BadgeStyle(
      backgroundColor: Color(0xFFFFE0B2), // Light orange/bronze
      textColor: Color(0xFFE65100), // Dark orange
      borderColor: Color(0xFFFF6F00), // Orange
      icon: Icons.local_fire_department,
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

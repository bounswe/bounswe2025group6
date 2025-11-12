import 'package:flutter/material.dart';
import '../utils/user_badge_helper.dart';
import '../l10n/app_localizations.dart';

/// Reusable badge widget with consistent styling
class BadgeWidget extends StatelessWidget {
  final String badge;
  final double fontSize;
  final double iconSize;
  final EdgeInsets padding;
  final bool showIcon;

  const BadgeWidget({
    Key? key,
    required this.badge,
    this.fontSize = 11,
    this.iconSize = 14,
    this.padding = const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    this.showIcon = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final style = getBadgeStyle(badge);
    // `badge` is a normalized key (e.g. 'dietitian', 'home_cook').
    // Localize the visible label using AppLocalizations.
    final loc = AppLocalizations.of(context)!;
    String localizedLabel;
    switch (badge) {
      case 'dietitian':
        localizedLabel = loc.badgeDietitian;
        break;
      case 'experienced_home_cook':
        localizedLabel = loc.badgeExperiencedHomeCook;
        break;
      case 'home_cook':
        localizedLabel = loc.badgeHomeCook;
        break;
      default:
        localizedLabel = loc.badgeCook;
    }

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: style.backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: style.borderColor, width: 1.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showIcon) ...[
            Icon(style.icon, size: iconSize, color: style.textColor),
            SizedBox(width: 4),
          ],
          Text(
            localizedLabel,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.bold,
              color: style.textColor,
            ),
          ),
        ],
      ),
    );
  }
}

/// Large badge widget for profile screens
class LargeBadgeWidget extends StatelessWidget {
  final String badge;

  const LargeBadgeWidget({Key? key, required this.badge}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final style = getBadgeStyle(badge);
    final loc = AppLocalizations.of(context)!;
    String localizedLabel;
    switch (badge) {
      case 'dietitian':
        localizedLabel = loc.badgeDietitian;
        break;
      case 'experienced_home_cook':
        localizedLabel = loc.badgeExperiencedHomeCook;
        break;
      case 'home_cook':
        localizedLabel = loc.badgeHomeCook;
        break;
      default:
        localizedLabel = loc.badgeCook;
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        color: style.backgroundColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: style.borderColor, width: 2),
        boxShadow: [
          BoxShadow(
            color: style.borderColor.withOpacity(0.3),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(style.icon, size: 24, color: style.textColor),
          SizedBox(width: 8),
          Text(
            localizedLabel,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: style.textColor,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

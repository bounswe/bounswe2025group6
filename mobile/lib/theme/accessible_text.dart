import 'package:flutter/material.dart';
import 'app_theme.dart';

/// A widget that automatically ensures text meets WCAG AA contrast requirements
/// Use this widget instead of Text when you want to guarantee accessibility
class AccessibleText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final Color? backgroundColor;
  final bool isLargeText;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  const AccessibleText(
    this.text, {
    super.key,
    this.style,
    this.backgroundColor,
    this.isLargeText = false,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = backgroundColor ?? Theme.of(context).scaffoldBackgroundColor;
    final baseStyle = style ?? const TextStyle();
    
    // Determine if this is large text based on font size and weight
    final fontSize = baseStyle.fontSize ?? 16;
    final fontWeight = baseStyle.fontWeight ?? FontWeight.normal;
    final isLarge = isLargeText || 
                   fontSize >= 18 || 
                   (fontSize >= 14 && fontWeight.index >= FontWeight.bold.index);

    // Check current color contrast
    final currentColor = baseStyle.color ?? AppTheme.textOnLight;
    final contrastRatio = AppTheme.getContrastRatio(currentColor, bgColor);
    
    // Determine minimum required contrast
    final requiredContrast = isLarge ? 3.0 : 4.5;
    
    // If contrast is insufficient, use an accessible color
    Color textColor = currentColor;
    if (contrastRatio < requiredContrast) {
      textColor = AppTheme.getAccessibleTextColor(bgColor);
      
      // Debug assertion in development mode
      assert(() {
        debugPrint(
          'AccessibleText: Adjusted text color for accessibility. '
          'Original contrast: ${contrastRatio.toStringAsFixed(2)}:1, '
          'Required: ${requiredContrast.toStringAsFixed(1)}:1'
        );
        return true;
      }());
    }

    return Text(
      text,
      style: baseStyle.copyWith(color: textColor),
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
    );
  }
}

/// Extension to check if a TextStyle meets accessibility requirements
extension TextStyleAccessibility on TextStyle {
  /// Check if this text style meets WCAG AA standards on the given background
  bool isAccessible(Color backgroundColor) {
    final textColor = color ?? AppTheme.textOnLight;
    final contrastRatio = AppTheme.getContrastRatio(textColor, backgroundColor);
    
    // Determine if large text
    final fSize = fontSize ?? 16;
    final fWeight = fontWeight ?? FontWeight.normal;
    final isLarge = fSize >= 18 || (fSize >= 14 && fWeight.index >= FontWeight.bold.index);
    
    final requiredRatio = isLarge ? 3.0 : 4.5;
    return contrastRatio >= requiredRatio;
  }

  /// Get the contrast ratio of this text style on the given background
  double contrastRatio(Color backgroundColor) {
    final textColor = color ?? AppTheme.textOnLight;
    return AppTheme.getContrastRatio(textColor, backgroundColor);
  }

  /// Create an accessible version of this TextStyle for the given background
  TextStyle makeAccessible(Color backgroundColor) {
    final textColor = color ?? AppTheme.textOnLight;
    final contrastRatio = AppTheme.getContrastRatio(textColor, backgroundColor);
    
    final fSize = fontSize ?? 16;
    final fWeight = fontWeight ?? FontWeight.normal;
    final isLarge = fSize >= 18 || (fSize >= 14 && fWeight.index >= FontWeight.bold.index);
    
    final requiredRatio = isLarge ? 3.0 : 4.5;
    
    if (contrastRatio >= requiredRatio) {
      return this;
    }
    
    return copyWith(color: AppTheme.getAccessibleTextColor(backgroundColor));
  }
}

/// Helper methods for creating accessible UI elements
class AccessibilityHelper {
  /// Validate that a color combination meets WCAG AA standards
  static void validateContrast({
    required Color foreground,
    required Color background,
    required bool isLargeText,
    String? context,
  }) {
    final ratio = AppTheme.getContrastRatio(foreground, background);
    final requiredRatio = isLargeText ? 3.0 : 4.5;
    
    if (ratio < requiredRatio) {
      debugPrint(
        'WARNING: Insufficient contrast ratio ${ratio.toStringAsFixed(2)}:1 '
        '(required: ${requiredRatio.toStringAsFixed(1)}:1) '
        '${context != null ? 'in $context' : ''}'
      );
    }
  }

  /// Get a contrast-compliant text color for a background
  static Color getTextColor(Color background, {bool isLargeText = false}) {
    final blackContrast = AppTheme.getContrastRatio(AppTheme.textOnLight, background);
    final whiteContrast = AppTheme.getContrastRatio(AppTheme.textOnDark, background);
    final requiredRatio = isLargeText ? 3.0 : 4.5;
    
    if (blackContrast >= requiredRatio) {
      return AppTheme.textOnLight;
    } else if (whiteContrast >= requiredRatio) {
      return AppTheme.textOnDark;
    } else {
      // Return the one with better contrast
      return blackContrast > whiteContrast ? AppTheme.textOnLight : AppTheme.textOnDark;
    }
  }
}

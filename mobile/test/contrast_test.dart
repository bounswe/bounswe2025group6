import 'package:flutter_test/flutter_test.dart';
import 'package:fithub/theme/app_theme.dart';
import 'package:flutter/material.dart';

void main() {
  group('Color Contrast Requirements - WCAG AA', () {
    test('Primary colors meet minimum contrast ratios', () {
      // Test primary green on white background
      final greenOnWhiteContrast = AppTheme.getContrastRatio(
        AppTheme.primaryGreen,
        Colors.white,
      );
      expect(greenOnWhiteContrast, greaterThanOrEqualTo(4.5),
          reason: 'Primary green on white should meet 4.5:1 for normal text');

      // Test button grey with white text
      final whiteOnGreyContrast = AppTheme.getContrastRatio(
        Colors.white,
        AppTheme.buttonGrey,
      );
      expect(whiteOnGreyContrast, greaterThanOrEqualTo(4.5),
          reason: 'White text on button grey should meet 4.5:1');
    });

    test('Text colors meet normal text contrast (4.5:1)', () {
      // Black text on white
      final blackOnWhiteContrast = AppTheme.getContrastRatio(
        AppTheme.textOnLight,
        Colors.white,
      );
      expect(blackOnWhiteContrast, greaterThanOrEqualTo(4.5));

      // Secondary text on white
      final secondaryOnWhiteContrast = AppTheme.getContrastRatio(
        AppTheme.textSecondary,
        Colors.white,
      );
      expect(secondaryOnWhiteContrast, greaterThanOrEqualTo(4.5));

      // Black text on background grey
      final blackOnGreyContrast = AppTheme.getContrastRatio(
        AppTheme.textOnLight,
        AppTheme.backgroundGrey,
      );
      expect(blackOnGreyContrast, greaterThanOrEqualTo(4.5));
    });

    test('Large text colors meet minimum contrast (3:1)', () {
      final largeTextContrast = AppTheme.getContrastRatio(
        AppTheme.largeTextSecondary,
        Colors.white,
      );
      expect(largeTextContrast, greaterThanOrEqualTo(3.0),
          reason: 'Large text secondary should meet 3:1 contrast');
    });

    test('Error, success, and warning colors are accessible', () {
      // Error color on white
      final errorContrast = AppTheme.getContrastRatio(
        AppTheme.errorColor,
        Colors.white,
      );
      expect(errorContrast, greaterThanOrEqualTo(4.5));

      // Success color on white
      final successContrast = AppTheme.getContrastRatio(
        AppTheme.successColor,
        Colors.white,
      );
      expect(successContrast, greaterThanOrEqualTo(4.5));

      // Warning color on white
      final warningContrast = AppTheme.getContrastRatio(
        AppTheme.warningColor,
        Colors.white,
      );
      expect(warningContrast, greaterThanOrEqualTo(4.5));
    });

    test('Link color meets contrast requirements', () {
      final linkContrast = AppTheme.getContrastRatio(
        AppTheme.linkColor,
        Colors.white,
      );
      expect(linkContrast, greaterThanOrEqualTo(4.5));
    });

    test('meetsNormalTextContrast correctly identifies valid combinations', () {
      // Should pass
      expect(
        AppTheme.meetsNormalTextContrast(AppTheme.textOnLight, Colors.white),
        isTrue,
      );

      // Should pass
      expect(
        AppTheme.meetsNormalTextContrast(AppTheme.textSecondary, Colors.white),
        isTrue,
      );

      // Should fail - same color
      expect(
        AppTheme.meetsNormalTextContrast(Colors.white, Colors.white),
        isFalse,
      );
    });

    test('meetsLargeTextContrast correctly identifies valid combinations', () {
      // Should pass for large text
      expect(
        AppTheme.meetsLargeTextContrast(
          AppTheme.largeTextSecondary,
          Colors.white,
        ),
        isTrue,
      );

      // Should fail - same color
      expect(
        AppTheme.meetsLargeTextContrast(Colors.white, Colors.white),
        isFalse,
      );
    });

    test('getAccessibleTextColor returns appropriate color', () {
      // For white background, should return dark text
      final textOnWhite = AppTheme.getAccessibleTextColor(Colors.white);
      expect(textOnWhite, equals(AppTheme.textOnLight));

      // For dark background, should return light text
      final textOnDark = AppTheme.getAccessibleTextColor(Colors.black);
      expect(textOnDark, equals(AppTheme.textOnDark));

      // For primary green, should return white
      final textOnGreen = AppTheme.getAccessibleTextColor(AppTheme.primaryGreen);
      expect(textOnGreen, equals(AppTheme.textOnDark));
    });

    test('Contrast ratio calculation is symmetric', () {
      final ratio1 = AppTheme.getContrastRatio(Colors.black, Colors.white);
      final ratio2 = AppTheme.getContrastRatio(Colors.white, Colors.black);
      expect(ratio1, equals(ratio2));
    });

    test('Maximum contrast ratio is 21:1 (black on white)', () {
      final maxContrast = AppTheme.getContrastRatio(Colors.black, Colors.white);
      expect(maxContrast, closeTo(21.0, 0.1));
    });

    test('Minimum contrast ratio is 1:1 (same color)', () {
      final minContrast = AppTheme.getContrastRatio(Colors.white, Colors.white);
      expect(minContrast, equals(1.0));
    });

    test('White text on button grey meets requirements', () {
      final contrast = AppTheme.getContrastRatio(
        AppTheme.textOnDark,
        AppTheme.buttonGrey,
      );
      expect(contrast, greaterThanOrEqualTo(4.5));
    });

    test('White text on primary green meets requirements', () {
      final contrast = AppTheme.getContrastRatio(
        AppTheme.textOnDark,
        AppTheme.primaryGreen,
      );
      expect(contrast, greaterThanOrEqualTo(4.5));
    });
  });

  group('Predefined text styles meet requirements', () {
    test('Normal text style is accessible on white', () {
      final contrast = AppTheme.getContrastRatio(
        AppTheme.normalText.color!,
        Colors.white,
      );
      expect(contrast, greaterThanOrEqualTo(4.5));
    });

    test('Heading styles are accessible on white', () {
      final h1Contrast = AppTheme.getContrastRatio(
        AppTheme.heading1.color!,
        Colors.white,
      );
      expect(h1Contrast, greaterThanOrEqualTo(4.5));

      final h2Contrast = AppTheme.getContrastRatio(
        AppTheme.heading2.color!,
        Colors.white,
      );
      expect(h2Contrast, greaterThanOrEqualTo(4.5));

      final h3Contrast = AppTheme.getContrastRatio(
        AppTheme.heading3.color!,
        Colors.white,
      );
      expect(h3Contrast, greaterThanOrEqualTo(4.5));
    });

    test('Large text styles meet 3:1 minimum', () {
      final largeTextContrast = AppTheme.getContrastRatio(
        AppTheme.largeText.color!,
        Colors.white,
      );
      // Large text should meet both 3:1 and 4.5:1 in our case
      expect(largeTextContrast, greaterThanOrEqualTo(3.0));
    });
  });
}

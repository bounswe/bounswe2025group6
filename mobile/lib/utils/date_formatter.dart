import '../models/user_profile.dart';

/// Utility class for formatting dates according to user preferences
class DateFormatter {
  /// Format a DateTime object according to the user's preferred date format
  /// 
  /// If [preferredFormat] is null, defaults to YYYY-MM-DD
  /// If [includeTime] is true, adds time in HH:MM format
  static String formatDate(
    DateTime dateTime, {
    DateFormat? preferredFormat,
    bool includeTime = true,
  }) {
    final format = preferredFormat ?? DateFormat.yyyymmdd;
    final localDateTime = dateTime.toLocal();
    
    String dateString;
    switch (format) {
      case DateFormat.mmddyyyy:
        dateString = '${localDateTime.month.toString().padLeft(2, '0')}/'
            '${localDateTime.day.toString().padLeft(2, '0')}/'
            '${localDateTime.year}';
        break;
      case DateFormat.ddmmyyyy:
        dateString = '${localDateTime.day.toString().padLeft(2, '0')}/'
            '${localDateTime.month.toString().padLeft(2, '0')}/'
            '${localDateTime.year}';
        break;
      case DateFormat.yyyymmdd:
        dateString = '${localDateTime.year}-'
            '${localDateTime.month.toString().padLeft(2, '0')}-'
            '${localDateTime.day.toString().padLeft(2, '0')}';
        break;
    }
    
    if (includeTime) {
      final timeString = '${localDateTime.hour.toString().padLeft(2, '0')}:'
          '${localDateTime.minute.toString().padLeft(2, '0')}';
      dateString += ' $timeString';
    }
    
    return dateString;
  }
  
  /// Format a date string (ISO 8601) according to the user's preferred date format
  /// 
  /// If [preferredFormat] is null, defaults to YYYY-MM-DD
  /// If [includeTime] is true, adds time in HH:MM format
  /// Returns empty string if dateTimeStr is null or invalid
  static String formatDateString(
    String? dateTimeStr, {
    DateFormat? preferredFormat,
    bool includeTime = true,
  }) {
    if (dateTimeStr == null) return '';
    
    try {
      final dateTime = DateTime.parse(dateTimeStr);
      return formatDate(
        dateTime,
        preferredFormat: preferredFormat,
        includeTime: includeTime,
      );
    } catch (e) {
      return 'Invalid date';
    }
  }
}


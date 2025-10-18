class Report {
  final int id;
  final String contentTypeName;
  final String reporterUsername;
  final String contentObjectPreview;
  final String reportType;
  final String? description;
  final String status;
  final DateTime createdAt;

  Report({
    required this.id,
    required this.contentTypeName,
    required this.reporterUsername,
    required this.contentObjectPreview,
    required this.reportType,
    this.description,
    required this.status,
    required this.createdAt,
  });

  factory Report.fromJson(Map<String, dynamic> json) {
    return Report(
      id: _parseId(json['id']),
      contentTypeName: json['content_type_name']?.toString() ?? '',
      reporterUsername: json['reporter_username']?.toString() ?? '',
      contentObjectPreview: json['content_object_preview']?.toString() ?? '',
      reportType: json['report_type']?.toString() ?? '',
      description: json['description']?.toString(),
      status: json['status']?.toString() ?? 'pending',
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  static int _parseId(dynamic value) {
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content_type_name': contentTypeName,
      'reporter_username': reporterUsername,
      'content_object_preview': contentObjectPreview,
      'report_type': reportType,
      'description': description,
      'status': status,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

/// Enum for content types that can be reported
enum ReportContentType {
  post,
  recipe,
  postcomment;

  String get value => name;
}

/// Enum for report types
enum ReportType {
  spam,
  inappropriate,
  harassment,
  other;

  String get value => name;

/*
Since this is now localized in the UI, we don't need hardcoded display names here.

  String get displayName {
    switch (this) {
      case ReportType.spam:
        return 'Spam';
      case ReportType.inappropriate:
        return 'Inappropriate Content';
        return name;
      case ReportType.harassment:
        return 'Harassment';
        return name;
      case ReportType.other:
        return 'Other';
        return name;
    }
*/
  }

/* Since descriptions are now localized in the UI, we don't need hardcoded descriptions here.

  String get description {
    switch (this) {
      case ReportType.spam:
        // return 'Unsolicited or repetitive content';
        // Localize in UI: AppLocalizations.of(context)!.reportTypeSpamDescription
        return '';
      case ReportType.inappropriate:
        // return 'Offensive or inappropriate material';
        // Localize in UI: AppLocalizations.of(context)!.reportTypeInappropriateDescription
        return '';
      case ReportType.harassment:
        // return 'Bullying or harassment';
        // Localize in UI: AppLocalizations.of(context)!.reportTypeHarassmentDescription
        return '';
      case ReportType.other:
        // return 'Other issues';
        // Localize in UI: AppLocalizations.of(context)!.reportTypeOtherDescription
        return '';
    }
  }
}
*/

/// Request model for creating a report
class CreateReportRequest {
  final ReportContentType contentType;
  final int objectId;
  final ReportType reportType;
  final String? description;

  CreateReportRequest({
    required this.contentType,
    required this.objectId,
    required this.reportType,
    this.description,
  });

  Map<String, dynamic> toJson() {
    return {
      'content_type': contentType.value,
      'object_id': objectId,
      'report_type': reportType.value,
      if (description != null && description!.isNotEmpty)
        'description': description,
    };
  }
}


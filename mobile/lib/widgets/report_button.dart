import 'package:flutter/material.dart';
import '../models/report.dart';
import '../theme/app_theme.dart';
import 'report_dialog.dart';

/// A reusable button for reporting content
/// Can be used in posts, recipes, or any other reportable content
class ReportButton extends StatelessWidget {
  final ReportContentType contentType;
  final int objectId;
  final String contentPreview;
  final IconData? icon;
  final String? label;
  final bool showLabel;
  final VoidCallback? onReportSubmitted;

  const ReportButton({
    super.key,
    required this.contentType,
    required this.objectId,
    required this.contentPreview,
    this.icon,
    this.label,
    this.showLabel = false,
    this.onReportSubmitted,
  });

  Future<void> _handleReport(BuildContext context) async {
    final result = await ReportDialog.show(
      context: context,
      contentType: contentType,
      objectId: objectId,
      contentPreview: contentPreview,
    );

    if (result == true && onReportSubmitted != null) {
      onReportSubmitted!();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (showLabel) {
      return TextButton.icon(
        onPressed: () => _handleReport(context),
        icon: Icon(
          icon ?? Icons.flag_outlined,
          size: 20,
          color: AppTheme.errorColor,
        ),
        label: Text(
          label ?? 'Report',
          style: const TextStyle(
            color: AppTheme.errorColor,
            fontSize: 14,
          ),
        ),
      );
    }

    return IconButton(
      icon: Icon(
        icon ?? Icons.flag_outlined,
        color: AppTheme.errorColor,
      ),
      tooltip: label ?? 'Report this content',
      onPressed: () => _handleReport(context),
    );
  }
}

/// A menu item for reporting content (to be used in PopupMenuButton)
class ReportMenuItem extends PopupMenuItem<String> {
  ReportMenuItem({
    super.key,
    VoidCallback? onTap,
  }) : super(
          value: 'report',
          onTap: onTap,
          child: const Row(
            children: [
              Icon(
                Icons.flag_outlined,
                color: AppTheme.errorColor,
                size: 20,
              ),
              SizedBox(width: 12),
              Text(
                'Report',
                style: TextStyle(
                  color: AppTheme.errorColor,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        );
}


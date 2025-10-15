import 'package:flutter/material.dart';
import '../models/report.dart';
import '../services/report_service.dart';
import '../theme/app_theme.dart';

/// A reusable dialog for reporting content (posts or recipes)
class ReportDialog extends StatefulWidget {
  final ReportContentType contentType;
  final int objectId;
  final String contentPreview;

  const ReportDialog({
    super.key,
    required this.contentType,
    required this.objectId,
    required this.contentPreview,
  });

  /// Show the report dialog
  static Future<bool?> show({
    required BuildContext context,
    required ReportContentType contentType,
    required int objectId,
    required String contentPreview,
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) => ReportDialog(
        contentType: contentType,
        objectId: objectId,
        contentPreview: contentPreview,
      ),
    );
  }

  @override
  State<ReportDialog> createState() => _ReportDialogState();
}

class _ReportDialogState extends State<ReportDialog> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  ReportType _selectedReportType = ReportType.spam;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submitReport() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      final reportService = ReportService();
      final request = CreateReportRequest(
        contentType: widget.contentType,
        objectId: widget.objectId,
        reportType: _selectedReportType,
        description: _descriptionController.text.trim().isNotEmpty
            ? _descriptionController.text.trim()
            : null,
      );

      await reportService.createReport(request);

      if (!mounted) return;

      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Report submitted successfully. Thank you for your feedback.'),
          backgroundColor: AppTheme.successColor,
          duration: Duration(seconds: 3),
        ),
      );

      // Close dialog and return true
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _isSubmitting = false;
      });

      // Show error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to submit report: ${e.toString()}'),
          backgroundColor: AppTheme.errorColor,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        'Report ${widget.contentType.value.toUpperCase()}',
        style: const TextStyle(
          color: AppTheme.textOnLight,
          fontWeight: FontWeight.bold,
        ),
      ),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Content preview
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.backgroundGrey,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  widget.contentPreview,
                  style: const TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 14,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: 16),

              // Report type label
              const Text(
                'Why are you reporting this?',
                style: TextStyle(
                  color: AppTheme.textOnLight,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 8),

              // Report type selection
              ...ReportType.values.map((type) {
                return RadioListTile<ReportType>(
                  title: Text(
                    type.displayName,
                    style: const TextStyle(
                      color: AppTheme.textOnLight,
                      fontSize: 15,
                    ),
                  ),
                  subtitle: Text(
                    type.description,
                    style: const TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                  value: type,
                  groupValue: _selectedReportType,
                  activeColor: AppTheme.primaryGreen,
                  onChanged: (ReportType? value) {
                    if (value != null) {
                      setState(() {
                        _selectedReportType = value;
                      });
                    }
                  },
                  contentPadding: EdgeInsets.zero,
                );
              }),

              const SizedBox(height: 16),

              // Description field
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Additional details (optional)',
                  hintText: 'Provide more information about this report...',
                  border: OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
                maxLines: 3,
                maxLength: 500,
                keyboardType: TextInputType.multiline,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isSubmitting
              ? null
              : () => Navigator.of(context).pop(false),
          child: const Text(
            'Cancel',
            style: TextStyle(color: AppTheme.textSecondary),
          ),
        ),
        ElevatedButton(
          onPressed: _isSubmitting ? null : _submitReport,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.errorColor,
            foregroundColor: AppTheme.textOnDark,
          ),
          child: _isSubmitting
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Text('Submit Report'),
        ),
      ],
    );
  }
}


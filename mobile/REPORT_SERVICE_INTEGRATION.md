# Report Service Integration Guide

This guide explains how to use the newly created Report Service in the FitHub mobile app.

## Overview

The Report Service allows users to report inappropriate content (posts or recipes) with the following report types:
- **Spam**: Unsolicited or repetitive content
- **Inappropriate**: Offensive or inappropriate material
- **Harassment**: Bullying or harassment
- **Other**: Other issues

## Files Created

### Models
- `lib/models/report.dart` - Report data models and enums

### Services
- `lib/services/report_service.dart` - Service for creating reports

### Widgets
- `lib/widgets/report_dialog.dart` - Reusable dialog for reporting content
- `lib/widgets/report_button.dart` - Reusable button components for reporting

### Tests
- `test/mocks/mock_report_service.dart` - Mock service for testing
- `test/report_service_test.dart` - Unit tests for report functionality

## Quick Start

### 1. Basic Usage - Report Dialog

```dart
import 'package:fithub/models/report.dart';
import 'package:fithub/widgets/report_dialog.dart';

// Show report dialog for a post
final result = await ReportDialog.show(
  context: context,
  contentType: ReportContentType.post,
  objectId: postId,
  contentPreview: 'Post title or preview text...',
);

// Show report dialog for a recipe
final result = await ReportDialog.show(
  context: context,
  contentType: ReportContentType.recipe,
  objectId: recipeId,
  contentPreview: recipeName,
);
```

### 2. Using ReportButton Widget

```dart
import 'package:fithub/widgets/report_button.dart';

// Icon button only
ReportButton(
  contentType: ReportContentType.post,
  objectId: post['id'],
  contentPreview: post['title'],
  onReportSubmitted: () {
    // Optional callback when report is submitted
    print('Report submitted successfully');
  },
)

// Button with label
ReportButton(
  contentType: ReportContentType.recipe,
  objectId: recipe.id,
  contentPreview: recipe.name,
  showLabel: true,
  label: 'Report Recipe',
)
```

### 3. Using in PopupMenu

```dart
import 'package:fithub/widgets/report_button.dart';
import 'package:fithub/widgets/report_dialog.dart';

PopupMenuButton<String>(
  itemBuilder: (context) => [
    // Other menu items...
    ReportMenuItem(
      onTap: () async {
        // Wait for menu to close
        await Future.delayed(const Duration(milliseconds: 100));
        if (!context.mounted) return;
        
        await ReportDialog.show(
          context: context,
          contentType: ReportContentType.post,
          objectId: postId,
          contentPreview: postTitle,
        );
      },
    ),
  ],
)
```

### 4. Direct Service Usage

```dart
import 'package:fithub/services/report_service.dart';
import 'package:fithub/models/report.dart';

final reportService = ReportService();

try {
  // Report a post
  final report = await reportService.reportPost(
    postId: 123,
    reportType: ReportType.spam,
    description: 'This post contains spam content',
  );
  
  print('Report created with ID: ${report.id}');
  
} on ReportServiceException catch (e) {
  print('Error: ${e.message}');
}

// Or report a recipe
try {
  final report = await reportService.reportRecipe(
    recipeId: 456,
    reportType: ReportType.inappropriate,
    description: 'Inappropriate recipe content',
  );
} catch (e) {
  print('Error: $e');
}
```

## Integration Examples

### Example 1: Add Report to Post Detail Screen

Update `lib/screens/community/post_detail_screen.dart`:

```dart
// In the AppBar actions
actions: [
  // Existing actions...
  ReportButton(
    contentType: ReportContentType.post,
    objectId: widget.postId,
    contentPreview: _post?['title'] ?? 'Post',
  ),
],
```

### Example 2: Add Report to Recipe Detail Screen

Update `lib/screens/recipe_detail_screen.dart`:

```dart
// In the AppBar or floating action button area
AppBar(
  actions: [
    ReportButton(
      contentType: ReportContentType.recipe,
      objectId: widget.recipeId,
      contentPreview: _recipe?.name ?? 'Recipe',
    ),
  ],
)
```

### Example 3: Add to Recipe Card Context Menu

Update `lib/widgets/recipe_card.dart`:

```dart
Card(
  child: ListTile(
    title: Text(recipe.name),
    trailing: PopupMenuButton<String>(
      itemBuilder: (context) => [
        const PopupMenuItem(
          value: 'view',
          child: Text('View Details'),
        ),
        ReportMenuItem(
          onTap: () async {
            await Future.delayed(const Duration(milliseconds: 100));
            if (!context.mounted) return;
            
            await ReportDialog.show(
              context: context,
              contentType: ReportContentType.recipe,
              objectId: recipe.id,
              contentPreview: recipe.name,
            );
          },
        ),
      ],
    ),
  ),
)
```

### Example 4: Add to Community Post Card

In your community post widgets:

```dart
Row(
  children: [
    // Other actions (like, comment, etc.)
    Spacer(),
    ReportButton(
      contentType: ReportContentType.post,
      objectId: post['id'],
      contentPreview: post['title'],
      showLabel: true,
      label: 'Report',
    ),
  ],
)
```

## Report Types

```dart
enum ReportType {
  spam,           // Unsolicited or repetitive content
  inappropriate,  // Offensive or inappropriate material
  harassment,     // Bullying or harassment
  other,          // Other issues
}

// Access display names
ReportType.spam.displayName          // "Spam"
ReportType.inappropriate.displayName // "Inappropriate Content"
ReportType.harassment.displayName    // "Harassment"
ReportType.other.displayName         // "Other"

// Access descriptions
ReportType.spam.description          // "Unsolicited or repetitive content"
```

## Error Handling

The service throws `ReportServiceException` with detailed error messages:

```dart
try {
  await reportService.createReport(request);
} on ReportServiceException catch (e) {
  // Handle specific errors
  if (e.statusCode == 401) {
    // User needs to log in
  } else if (e.statusCode == 404) {
    // Content not found
  } else if (e.statusCode == 400) {
    // Invalid input
  }
  
  // Show error to user
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(e.message)),
  );
}
```

## Testing

Run the report service tests:

```bash
flutter test test/report_service_test.dart
```

Use the mock service in your tests:

```dart
import 'package:fithub/test/mocks/mock_report_service.dart';

final mockReportService = MockReportService();
when(() => mockReportService.reportPost(
  postId: any(named: 'postId'),
  reportType: any(named: 'reportType'),
)).thenAnswer((_) async => FakeReport());
```

## Best Practices

1. **Always provide content preview**: Help users understand what they're reporting
2. **Use onReportSubmitted callback**: Update UI or refresh data after successful report
3. **Handle errors gracefully**: Show user-friendly error messages
4. **Use appropriate report types**: Help categorize reports correctly
5. **Add confirmation**: The dialog already handles confirmation, no extra dialogs needed

## API Details

- **Endpoint**: `POST /api/reports/`
- **Authentication**: Required (Bearer token)
- **Success Response**: 201 Created with Report object
- **Error Responses**: 
  - 400 Bad Request (invalid input)
  - 401 Unauthorized (not authenticated)
  - 404 Not Found (content doesn't exist)

## Support

For issues or questions about the report service, refer to:
- Backend documentation: `/practice-app/backend/docs/`
- Service implementation: `lib/services/report_service.dart`
- Widget examples: `lib/widgets/report_dialog.dart` and `lib/widgets/report_button.dart`


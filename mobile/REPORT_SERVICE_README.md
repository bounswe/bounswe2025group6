# Report Service Implementation

## Overview

A complete report service has been implemented for the FitHub mobile application, allowing users to report inappropriate content (posts or recipes) to moderators.

## What Was Created

### 1. Core Files

#### Models (`lib/models/`)
- **`report.dart`** - Complete report data models including:
  - `Report` class - Main report entity with full response data
  - `ReportContentType` enum - Defines reportable content types (post, recipe)
  - `ReportType` enum - Report categories (spam, inappropriate, harassment, other)
  - `CreateReportRequest` class - Request payload for creating reports

#### Services (`lib/services/`)
- **`report_service.dart`** - Report service with:
  - `createReport()` - Main method for creating reports
  - `reportPost()` - Helper method for reporting posts
  - `reportRecipe()` - Helper method for reporting recipes
  - Automatic JWT token refresh on 401 errors
  - Comprehensive error handling with `ReportServiceException`

#### Widgets (`lib/widgets/`)
- **`report_dialog.dart`** - Full-featured report dialog with:
  - Radio buttons for selecting report type
  - Optional description text field
  - Content preview display
  - Loading states and error handling
  - Success/error notifications
  
- **`report_button.dart`** - Reusable report components:
  - `ReportButton` widget - Icon or labeled button
  - `ReportMenuItem` widget - For popup menus
  - Customizable appearance and callbacks

### 2. Testing Files

#### Mocks (`test/mocks/`)
- **`mock_report_service.dart`** - Mock service for unit testing

#### Tests (`test/`)
- **`report_service_test.dart`** - Comprehensive unit tests covering:
  - Report creation success scenarios
  - Error handling
  - Report type helpers (reportPost, reportRecipe)
  - Enum functionality
  - Request serialization

### 3. Documentation

- **`REPORT_SERVICE_INTEGRATION.md`** - Complete integration guide with examples
- **`REPORT_INTEGRATION_EXAMPLES.dart`** - Code examples for common scenarios
- **`REPORT_SERVICE_README.md`** - This file

## Features

✅ **Multi-content Support**: Report both posts and recipes  
✅ **Four Report Types**: Spam, Inappropriate, Harassment, Other  
✅ **User-friendly UI**: Clean dialog with radio selections  
✅ **Optional Descriptions**: Users can provide additional context  
✅ **Token Management**: Automatic JWT refresh on expiration  
✅ **Error Handling**: Detailed error messages for different scenarios  
✅ **Accessibility**: Follows app's WCAG AA compliant theme  
✅ **Reusable Components**: Multiple widget options for different use cases  
✅ **Well Tested**: Comprehensive unit test coverage  
✅ **Type Safe**: Full Dart type safety with enums and models  

## Quick Integration

### Simplest Usage (Recommended)

Add a report button to any screen:

```dart
import 'package:fithub/widgets/report_button.dart';
import 'package:fithub/models/report.dart';

// In your widget
ReportButton(
  contentType: ReportContentType.post, // or ReportContentType.recipe
  objectId: postId,
  contentPreview: 'Post title or content preview',
)
```

### Menu Integration

Add to a popup menu:

```dart
import 'package:fithub/widgets/report_button.dart';

PopupMenuButton<String>(
  itemBuilder: (context) => [
    // Your other menu items...
    ReportMenuItem(
      onTap: () async {
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

## API Integration

The service connects to the backend endpoint:

- **URL**: `POST http://10.0.2.2:8000/reports/reports/`
- **Auth**: Bearer token (automatic from storage)
- **Request Body**:
  ```json
  {
    "content_type": "post",
    "object_id": 123,
    "report_type": "spam",
    "description": "Optional description"
  }
  ```
- **Success Response**: 201 Created with Report object
- **Error Responses**: 400 (bad request), 401 (unauthorized), 404 (not found)

## Report Types

| Type | Display Name | Description |
|------|-------------|-------------|
| `spam` | Spam | Unsolicited or repetitive content |
| `inappropriate` | Inappropriate Content | Offensive or inappropriate material |
| `harassment` | Harassment | Bullying or harassment |
| `other` | Other | Other issues |

## Architecture

Follows the existing FitHub mobile app architecture:

```
lib/
├── models/
│   └── report.dart           # Data models
├── services/
│   └── report_service.dart   # Business logic & API
├── widgets/
│   ├── report_dialog.dart    # UI dialog component
│   └── report_button.dart    # Reusable buttons
└── screens/
    └── [existing screens]     # Integration points

test/
├── mocks/
│   └── mock_report_service.dart
└── report_service_test.dart
```

## Integration Points

Recommended screens to add report functionality:

1. **Post Detail Screen** (`lib/screens/community/post_detail_screen.dart`)
   - Add ReportButton to AppBar actions
   
2. **Recipe Detail Screen** (`lib/screens/recipe_detail_screen.dart`)
   - Add ReportButton to AppBar or menu
   
3. **Community Screen** (`lib/screens/community/community_screen.dart`)
   - Add ReportMenuItem to post card menus
   
4. **Recipe Card Widget** (`lib/widgets/recipe_card.dart`)
   - Add ReportMenuItem to recipe card menus

See `REPORT_INTEGRATION_EXAMPLES.dart` for detailed code examples.

## Testing

Run the tests:

```bash
# Run all tests
flutter test

# Run only report service tests
flutter test test/report_service_test.dart
```

Test coverage includes:
- ✅ Successful report creation
- ✅ Error handling (network, auth, validation)
- ✅ Report type helpers
- ✅ Enum display names and values
- ✅ Request serialization
- ✅ Mock service integration

## Best Practices

1. **Content Preview**: Always provide a meaningful preview of what's being reported
2. **User Context**: Don't show report options for user's own content
3. **Error Handling**: The widgets handle errors automatically, but you can add custom callbacks
4. **Confirmation**: The dialog provides built-in confirmation, no extra dialogs needed
5. **Accessibility**: All components follow WCAG AA standards from AppTheme

## Error Handling

The service provides detailed error messages:

```dart
try {
  await reportService.reportPost(postId: 123, reportType: ReportType.spam);
} on ReportServiceException catch (e) {
  // e.message - User-friendly error message
  // e.statusCode - HTTP status code (if available)
}
```

Common error scenarios:
- **401**: User not authenticated (auto-handled with token refresh)
- **400**: Invalid request (validation error with details)
- **404**: Content not found (deleted or doesn't exist)
- **500**: Server error (retry suggestion)

## Next Steps

1. **Integrate into screens**: Add ReportButton to post and recipe detail screens
2. **Test in app**: Build and run the app to test the functionality
3. **Customize styling**: Adjust colors/fonts if needed (uses AppTheme by default)
4. **Add analytics**: Track report submissions if needed
5. **Handle notifications**: Add user feedback after successful reports

## Maintenance

To extend the report functionality:

1. **Add new content types**: Update `ReportContentType` enum in `report.dart`
2. **Add new report types**: Update `ReportType` enum in `report.dart`
3. **Customize UI**: Modify `report_dialog.dart` and `report_button.dart`
4. **Add features**: Extend `ReportService` with new methods

## Dependencies Used

All dependencies are already in `pubspec.yaml`:
- `http` ^1.1.0 - HTTP requests
- `flutter_secure_storage` ^9.2.4 - Token storage
- `mocktail` ^1.0.0 - Testing

No new dependencies were added.

## Support

For questions or issues:
1. Check `REPORT_SERVICE_INTEGRATION.md` for detailed examples
2. Review `REPORT_INTEGRATION_EXAMPLES.dart` for code samples
3. Examine existing service implementations (auth_service.dart, community_service.dart)
4. Run tests to verify functionality

---

**Status**: ✅ Ready for integration  
**Version**: 1.0.0  
**Last Updated**: 2025-10-14


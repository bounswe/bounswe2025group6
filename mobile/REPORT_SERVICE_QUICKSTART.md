# Report Service - Quick Start Guide

## 🚀 In 60 Seconds

### Add Report to Any Screen

**1. Add import:**
```dart
import 'package:fithub/widgets/report_button.dart';
import 'package:fithub/models/report.dart';
```

**2. Add button:**
```dart
// For posts
ReportButton(
  contentType: ReportContentType.post,
  objectId: postId,
  contentPreview: postTitle,
)

// For recipes
ReportButton(
  contentType: ReportContentType.recipe,
  objectId: recipeId,
  contentPreview: recipeName,
)
```

**That's it!** ✅

---

## 📦 What You Get

When you add `ReportButton`, users can:
1. Click the report button (🚩 flag icon)
2. Select a report type:
   - 🚫 Spam
   - ⚠️ Inappropriate Content
   - 😠 Harassment
   - 📝 Other
3. Add optional description
4. Submit the report

The widget handles:
- ✅ Opening the dialog
- ✅ Form validation
- ✅ API calls
- ✅ Loading states
- ✅ Error messages
- ✅ Success notifications
- ✅ Token refresh

---

## 🎯 Common Use Cases

### Use Case 1: AppBar Button
```dart
AppBar(
  title: Text('Post Details'),
  actions: [
    ReportButton(
      contentType: ReportContentType.post,
      objectId: post.id,
      contentPreview: post.title,
    ),
  ],
)
```

### Use Case 2: Popup Menu
```dart
PopupMenuButton<String>(
  itemBuilder: (context) => [
    ReportMenuItem(
      onTap: () async {
        await Future.delayed(Duration(milliseconds: 100));
        if (!context.mounted) return;
        
        await ReportDialog.show(
          context: context,
          contentType: ReportContentType.post,
          objectId: post.id,
          contentPreview: post.title,
        );
      },
    ),
  ],
)
```

### Use Case 3: Text Button
```dart
ReportButton(
  contentType: ReportContentType.recipe,
  objectId: recipe.id,
  contentPreview: recipe.name,
  showLabel: true,
  label: 'Report Recipe',
)
```

---

## 📁 Files Created

```
mobile/
├── lib/
│   ├── models/
│   │   └── report.dart                    ← Data models
│   ├── services/
│   │   └── report_service.dart            ← API service
│   └── widgets/
│       ├── report_button.dart             ← Reusable button
│       └── report_dialog.dart             ← Report dialog
├── test/
│   ├── mocks/
│   │   └── mock_report_service.dart       ← Mock for testing
│   └── report_service_test.dart           ← Unit tests
├── REPORT_SERVICE_README.md               ← Main documentation
├── REPORT_SERVICE_INTEGRATION.md          ← Integration guide
├── REPORT_INTEGRATION_EXAMPLES.dart       ← Code examples
└── REPORT_SERVICE_QUICKSTART.md           ← This file
```

---

## 🔧 Integration Checklist

**Recommended screens to add reporting:**

- [ ] **Post Detail Screen** (`lib/screens/community/post_detail_screen.dart`)
  ```dart
  // Add to AppBar actions
  ReportButton(
    contentType: ReportContentType.post,
    objectId: widget.postId,
    contentPreview: _post?['title'] ?? 'Post',
  )
  ```

- [ ] **Recipe Detail Screen** (`lib/screens/recipe_detail_screen.dart`)
  ```dart
  // Add to AppBar actions
  ReportButton(
    contentType: ReportContentType.recipe,
    objectId: widget.recipeId,
    contentPreview: _recipe?.name ?? 'Recipe',
  )
  ```

- [ ] **Community Screen** (`lib/screens/community/community_screen.dart`)
  ```dart
  // Add ReportMenuItem to post card menus
  ```

- [ ] **Recipe Card Widget** (`lib/widgets/recipe_card.dart`)
  ```dart
  // Add ReportMenuItem to recipe card menus
  ```

---

## 🎨 Customization Options

```dart
ReportButton(
  contentType: ReportContentType.post,
  objectId: 123,
  contentPreview: 'Content preview',
  
  // Optional customizations:
  icon: Icons.report_outlined,          // Custom icon
  label: 'Report This',                  // Custom label
  showLabel: true,                       // Show text label
  onReportSubmitted: () {                // Callback after success
    print('Report submitted!');
    // Refresh data, show message, etc.
  },
)
```

---

## 🧪 Testing

**Run tests:**
```bash
flutter test test/report_service_test.dart
```

**All tests should pass** ✅

---

## ⚠️ Important Notes

1. **Don't show report for own content**: 
   ```dart
   if (post['author_id'] != currentUserId)
     ReportButton(...)
   ```

2. **Provide meaningful preview**:
   ```dart
   contentPreview: post['title']  // ✅ Good
   contentPreview: 'Content'      // ❌ Not helpful
   ```

3. **Handle mounted state**:
   ```dart
   if (!context.mounted) return;  // Always check before navigation
   ```

---

## 📚 Need More Details?

- **Full Integration Guide**: `REPORT_SERVICE_INTEGRATION.md`
- **Code Examples**: `REPORT_INTEGRATION_EXAMPLES.dart`
- **Complete Docs**: `REPORT_SERVICE_README.md`

---

## 🆘 Troubleshooting

**Problem**: "Authentication required"  
**Solution**: User needs to log in. The service auto-refreshes tokens.

**Problem**: "Content not found" (404)  
**Solution**: The post/recipe was deleted. Handle gracefully.

**Problem**: Button doesn't appear  
**Solution**: Check imports and make sure widget is in the widget tree.

**Problem**: Tests failing  
**Solution**: Run `flutter pub get` and ensure all dependencies are installed.

---

## ✨ You're Done!

The report service is:
- ✅ **Complete**: All functionality implemented
- ✅ **Tested**: Unit tests included and passing
- ✅ **Documented**: Multiple documentation files
- ✅ **Ready**: Just add the button to your screens
- ✅ **Maintainable**: Follows existing code patterns
- ✅ **Accessible**: WCAG AA compliant

**Happy Reporting! 🚩**


import 'package:flutter/material.dart';
import '../../services/community_service.dart';
import '../../services/storage_service.dart';
import '../../l10n/app_localizations.dart';
import '../../utils/tag_localization.dart';

class EditPostScreen extends StatefulWidget {
  final Map<String, dynamic> post;

  const EditPostScreen({Key? key, required this.post}) : super(key: key);

  @override
  State<EditPostScreen> createState() => _EditPostScreenState();
}

class _EditPostScreenState extends State<EditPostScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _contentController;
  late bool _isCommentable;
  late List<String> _tags;
  final List<String> _validTags = [
    // Keep English tag values for backend compatibility
    'Budget', 'Meal Prep', 'Family', 'No Waste', 'Sustainability',
    'Tips', 'Gluten Free', 'Vegan', 'Vegetarian', 'Quick',
    'Healthy', 'Student', 'Nutrition', 'Healthy Eating', 'Snacks'
  ];
  bool _isLoading = false;
  late final CommunityService _communityService;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.post['title']);
    _contentController = TextEditingController(text: widget.post['content']);
    _isCommentable = widget.post['is_commentable'] ?? true;
    _tags = List<String>.from(widget.post['tags'] ?? []);
    _initializeCommunityService();
  }

  Future<void> _initializeCommunityService() async {
    final token = await StorageService.getJwtAccessToken();
    _communityService = CommunityService(token: token);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _updatePost() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() => _isLoading = true);

      try {
        await _communityService.updatePost(
          id: widget.post['id'],
          title: _titleController.text,
          content: _contentController.text,
          tags: _tags,
          isCommentable: _isCommentable,
        );

        if (!mounted) return;
        Navigator.pop(context, true);
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      } finally {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    }
  }

  // localizedTagLabel helper provided by lib/utils/tag_localization.dart

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
  title: Text(AppLocalizations.of(context)!.editPostTitle), // 'Edit Post'
        actions: [
          _isLoading
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: CircularProgressIndicator(color: Colors.black),
                  ),
                )
              : TextButton(
                  onPressed: _updatePost,
                  child: Text(AppLocalizations.of(context)!.saveButton, style: const TextStyle(color: Colors.black)), // 'Save'
                ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            TextFormField(
              controller: _titleController,
              decoration: InputDecoration(
                labelText: AppLocalizations.of(context)!.titleLabel,
                border: const OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty)
                  // 'Title is required'
                  return AppLocalizations.of(context)!.titleRequired;
                if (value.length > 255)
                  // 'Title too long'
                  return AppLocalizations.of(context)!.titleTooLong;
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _contentController,
              decoration: InputDecoration(
                labelText: AppLocalizations.of(context)!.contentLabel,
                border: const OutlineInputBorder(),
              ),
              maxLines: 5,
              validator: (value) {
                if (value == null || value.isEmpty)
                  // 'Content is required'
                  return AppLocalizations.of(context)!.contentRequired;
                if (value.length > 1000)
                  // 'Content too long'
                  return AppLocalizations.of(context)!.contentTooLong;
                return null;
              },
            ),
            const SizedBox(height: 16),
            Text(AppLocalizations.of(context)!.tagsLabel, style: const TextStyle(fontSize: 16)),
            Wrap(
              spacing: 8,
              children: _validTags.map((tag) => FilterChip(
                label: Text(localizedTagLabel(context, tag)),
                selected: _tags.contains(tag),
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _tags.add(tag);
                    } else {
                      _tags.remove(tag);
                    }
                  });
                },
              )).toList(),
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              title: Text(AppLocalizations.of(context)!.allowComments),
              value: _isCommentable,
              onChanged: (value) => setState(() => _isCommentable = value),
            ),
          ],
        ),
      ),
    );
  }
}
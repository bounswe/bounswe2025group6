import 'package:flutter/material.dart';
import '../../services/community_service.dart';
import '../../services/storage_service.dart';
import '../../screens/login_screen.dart';
import '../../l10n/app_localizations.dart';
import '../../utils/tag_localization.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({Key? key}) : super(key: key);

  static const routeName = '/community/create';

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  // Keep English values for tags (backend expects these); comment left for reference
  final List<String> _validTags = [
    'Budget', 'Meal Prep', 'Family', 'No Waste', 'Sustainability',
    'Tips', 'Gluten Free', 'Vegan', 'Vegetarian', 'Quick',
    'Healthy', 'Student', 'Nutrition', 'Healthy Eating', 'Snacks'
  ];
  late final CommunityService _communityService;
  bool _isLoading = false;
  bool _isCommentable = true;
  List<String> _tags = [];

  @override
  void initState() {
    super.initState();
    _initializeCommunityService();
  }

  Future<void> _initializeCommunityService() async {
    final token = await StorageService.getJwtAccessToken();
    
    if (token == null) {
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (route) => false,
      );
      return;
    }

    setState(() {
      _communityService = CommunityService(token: token);
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Widget _buildTagChip(String tag) {
    return Chip(
      // Display localized label for stored English tag value
      label: Text(localizedTagLabel(context, tag)),
      deleteIcon: const Icon(Icons.close, size: 18),
      onDeleted: () {
        setState(() {
          _tags.remove(tag);
        });
      },
    );
  }

  Widget _buildTagSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context)!.tagsLabel,
          style: const TextStyle(fontSize: 16),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
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
        if (_tags.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(AppLocalizations.of(context)!.selectedTagsLabel, style: const TextStyle(fontWeight: FontWeight.bold)),
          Wrap(
            spacing: 8,
            children: _tags.map(_buildTagChip).toList(),
          ),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
  title: Text(AppLocalizations.of(context)!.createPostTitle), // 'Create Post'
        actions: [
          _isLoading
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: CircularProgressIndicator(color: Colors.black),
                  ),
                )
              : TextButton(
                  onPressed: _submitPost,
                  child: Text(
                    AppLocalizations.of(context)!.postButton, // 'Post'
                    style: const TextStyle(color: Colors.black),
                  ),
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
                helperText: AppLocalizations.of(context)!.titleHelper,
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  // 'Title is required'
                  return AppLocalizations.of(context)!.titleRequired;
                }
                if (value.length > 255) {
                  // 'Title must be less than 255 characters'
                  return AppLocalizations.of(context)!.titleTooLong;
                }
                if (value.length < 1) {
                  // 'Title must be at least 1 character'
                  return AppLocalizations.of(context)!.titleTooShort;
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _contentController,
                decoration: InputDecoration(
                labelText: AppLocalizations.of(context)!.contentLabel,
                border: const OutlineInputBorder(),
                helperText: AppLocalizations.of(context)!.contentHelper,
              ),
              maxLines: 5,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  // 'Content is required'
                  return AppLocalizations.of(context)!.contentRequired;
                }
                if (value.length > 1000) {
                  // 'Content must be less than 1000 characters'
                  return AppLocalizations.of(context)!.contentTooLong;
                }
                if (value.length < 1) {
                  // 'Content must be at least 1 character'
                  return AppLocalizations.of(context)!.contentTooShort;
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            _buildTagSection(),
            const SizedBox(height: 16),
            SwitchListTile(
              title: Text(AppLocalizations.of(context)!.allowComments),
              value: _isCommentable,
              onChanged: (bool value) {
                setState(() {
                  _isCommentable = value;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitPost() async {

    if (_formKey.currentState?.validate() ?? false) {
      setState(() => _isLoading = true);

      try {
        final token = await StorageService.getJwtAccessToken();
        
        if (token == null) {
          throw Exception('Not authenticated');
        }

        _communityService.token = token; 

        await _communityService.createPost(
          title: _titleController.text,
          content: _contentController.text,
          tags: _tags,
          isCommentable: _isCommentable,
        );
        
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.postCreatedSuccess)),
        );
        Navigator.pop(context, true);
      } catch (e) {
        if (!mounted) return;
        print('Debug - Error in submit: ${e.toString()}');
        
        if (e.toString().contains('Authentication failed')) {
          // Token refresh failed, redirect to login
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (context) => const LoginScreen()),
            (route) => false,
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString())),
          );
        }
      } finally {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    }
  }
}
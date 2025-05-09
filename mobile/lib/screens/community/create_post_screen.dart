import 'package:flutter/material.dart';
import '../../services/community_service.dart';
import '../../services/storage_service.dart';
import '../../screens/login_screen.dart';

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
    final token = await StorageService.getAccessToken();
    
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
      label: Text(tag),
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
        const Text(
          'Tags*',
          style: TextStyle(fontSize: 16),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _validTags.map((tag) => FilterChip(
            label: Text(tag),
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
          const Text('Selected Tags:', style: TextStyle(fontWeight: FontWeight.bold)),
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
        title: const Text('Create Post'),
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
                  child: const Text(
                    'Post',
                    style: TextStyle(color: Colors.black),
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
              decoration: const InputDecoration(
                labelText: 'Title*',
                border: OutlineInputBorder(),
                helperText: 'Maximum 255 characters',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Title is required';
                }
                if (value.length > 255) {
                  return 'Title must be less than 255 characters';
                }
                if (value.length < 1) {
                  return 'Title must be at least 1 character';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _contentController,
              decoration: const InputDecoration(
                labelText: 'Content*',
                border: OutlineInputBorder(),
                helperText: 'Maximum 1000 characters',
              ),
              maxLines: 5,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Content is required';
                }
                if (value.length > 1000) {
                  return 'Content must be less than 1000 characters';
                }
                if (value.length < 1) {
                  return 'Content must be at least 1 character';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            _buildTagSection(),
            const SizedBox(height: 16),
            SwitchListTile(
              title: const Text('Allow Comments'),
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
        final token = await StorageService.getAccessToken();
        
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
          const SnackBar(content: Text('Post created successfully')),
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
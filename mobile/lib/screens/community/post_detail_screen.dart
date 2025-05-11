import 'package:flutter/material.dart';
import '../../services/community_service.dart';
import '../../services/storage_service.dart';
import './edit_post_screen.dart';

class PostDetailScreen extends StatefulWidget {
  const PostDetailScreen({Key? key}) : super(key: key);

  static const routeName = '/community/detail';

  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  final _commentController = TextEditingController();
  Map<String, dynamic>? post;
  bool _isLoading = true;
  final CommunityService _communityService = CommunityService();

  @override
  void initState() {
    super.initState();
    _initializePost();
  }

  Future<void> _initializePost() async {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final postId = ModalRoute.of(context)?.settings.arguments as int?;
      if (postId != null) {
        try {
          final token = await StorageService.getJwtAccessToken();
          _communityService.token = token;
          
          final postDetail = await _communityService.getPostDetail(postId);
          if (mounted) {
            setState(() {
              post = postDetail;
              _isLoading = false;
            });
          }
        } catch (e) {
          if (mounted) {
            setState(() {
              _isLoading = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(e.toString())),
            );
          }
        }
      }
    });
  }

  Future<void> _showDeleteConfirmation() async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Post'),
        content: const Text('Are you sure you want to delete this post?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (shouldDelete == true && mounted) {
      try {
        await _communityService.deletePost(post!['id']);
        if (!mounted) return;
        Navigator.of(context).pop(true); // Return true to indicate post was deleted
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  Future<void> _navigateToEditScreen() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EditPostScreen(post: post!),
      ),
    );

    if (result == true && mounted) {
      _initializePost(); // Refresh post details
    }
  }

  String _formatDateTime(String? dateTimeStr) {
    if (dateTimeStr == null) return '';
    final dateTime = DateTime.parse(dateTimeStr).toLocal();
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (post == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Error'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Post not found',
                style: TextStyle(fontSize: 18),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Post Detail'),
        actions: [
          if (post != null) ...[
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: _navigateToEditScreen,
            ),
            IconButton(
              icon: const Icon(Icons.delete),
              onPressed: _showDeleteConfirmation,
            ),
          ],
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                Text(
                  post!['title'] ?? '',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 16),
                if (post!['tags'] != null)
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: (post!['tags'] as List)
                        .map((tag) => Chip(label: Text(tag.toString())))
                        .toList(),
                  ),
                const SizedBox(height: 16),
                Text(post!['content'] ?? ''),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('By ${post!['author']?.toString() ?? 'Unknown'}'),
                    Row(
                      children: [
                        const Icon(Icons.remove_red_eye),
                        const SizedBox(width: 4),
                        Text('${post!['view_count'] ?? 0}'),
                        const SizedBox(width: 16),
                        const Icon(Icons.favorite),
                        const SizedBox(width: 4),
                        Text('${post!['upvote_count'] ?? 0}'),
                        const SizedBox(width: 16),
                        const Icon(Icons.thumb_down),
                        const SizedBox(width: 4),
                        Text('${post!['downvote_count'] ?? 0}'),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Created: ${_formatDateTime(post!['created_at'])}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const Divider(height: 32),
                const Text('Comments', style: TextStyle(fontWeight: FontWeight.bold)),
                // TODO: Add comments list
              ],
            ),
          ),
          if (post!['is_commentable'] ?? false)
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _commentController,
                      decoration: const InputDecoration(
                        hintText: 'Add a comment...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.send),
                    onPressed: () {
                      // TODO: Implement comment submission
                      _commentController.clear();
                    },
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }
}
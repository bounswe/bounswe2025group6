import 'dart:convert'; // For jsonDecode
import 'package:flutter/material.dart';
import '../../models/forum_comment.dart'; // Import ForumComment model
import '../../services/community_service.dart';
import '../../services/storage_service.dart';
import './edit_post_screen.dart';
import '../../widgets/comment_card.dart'; // Import CommentCard (will be created later)

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
  String? currentVote;
  bool isVoteLoading = false;
  List<Map<String, dynamic>> _comments =
      []; // Use Map for now, includes author_username
  bool _isCommentsLoading = false;
  String? _commentsError;
  bool _isSubmittingComment = false;
  int? _currentUserId; // To store the logged-in user's ID

  @override
  void initState() {
    super.initState();
    _initializePost();
    _loadCurrentUserId(); // Load user ID
  }

  Future<void> _loadCurrentUserId() async {
    final token = await StorageService.getJwtAccessToken();
    if (token != null) {
      try {
        final parts = token.split('.');
        if (parts.length != 3) {
          throw Exception('Invalid token format');
        }
        final payload = jsonDecode(
          utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
        );
        if (mounted) {
          setState(() {
            _currentUserId = payload['user_id'] as int?;
          });
        }
      } catch (e) {
        // Handle error decoding token or finding user_id
        print('Error decoding token: $e');
      }
    }
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
            _loadVoteStatus();
            _loadComments(); // Load comments after post is loaded
          }
        } catch (e) {
          if (mounted) {
            setState(() {
              _isLoading = false;
            });
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(SnackBar(content: Text(e.toString())));
          }
        }
      }
    });
  }

  Future<void> _showDeleteConfirmation() async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('Delete Post'),
            content: const Text('Are you sure you want to delete this post?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text(
                  'Delete',
                  style: TextStyle(color: Colors.red),
                ),
              ),
            ],
          ),
    );

    if (shouldDelete == true && mounted) {
      try {
        await _communityService.deletePost(post!['id']);
        if (!mounted) return;
        Navigator.of(
          context,
        ).pop(true); // Return true to indicate post was deleted
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _navigateToEditScreen() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => EditPostScreen(post: post!)),
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

  Future<void> _loadVoteStatus() async {
    if (post == null) return;

    try {
      final vote = await _communityService.getUserVote(post!['id']);
      if (mounted) {
        setState(() {
          currentVote = vote?['vote_type'];
        });
      }
    } catch (e) {
      // Handle error silently
    }
  }

  // --- Comment Methods ---

  Future<void> _loadComments() async {
    if (post == null) return;
    setState(() {
      _isCommentsLoading = true;
      _commentsError = null;
    });

    try {
      final response = await _communityService.getComments(post!['id']);
      if (mounted) {
        setState(() {
          // Store the raw map data which includes 'author_username'
          _comments = List<Map<String, dynamic>>.from(response['results']);
          _isCommentsLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _commentsError = e.toString();
          _isCommentsLoading = false;
        });
      }
    }
  }

  Future<void> _submitComment() async {
    if (_commentController.text.isEmpty ||
        _isSubmittingComment ||
        post == null) {
      return;
    }

    setState(() {
      _isSubmittingComment = true;
    });

    try {
      await _communityService.createComment(
        post!['id'],
        _commentController.text,
      );
      _commentController.clear();
      FocusScope.of(context).unfocus(); // Hide keyboard
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Comment added!')));
      }
      await _loadComments(); // Refresh comments list
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add comment: ${e.toString()}'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmittingComment = false;
        });
      }
    }
  }

  Future<void> _deleteComment(int commentId) async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('Delete Comment'),
            content: const Text(
              'Are you sure you want to delete this comment?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text(
                  'Delete',
                  style: TextStyle(color: Colors.red),
                ),
              ),
            ],
          ),
    );

    if (shouldDelete == true && mounted && post != null) {
      try {
        await _communityService.deleteComment(post!['id'], commentId);
        if (!mounted) return;
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Comment deleted!')));
        await _loadComments(); // Refresh comments list
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to delete comment: ${e.toString()}'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  // --- Post Vote Handling ---
  Future<void> _handleVote(String voteType) async {
    if (isVoteLoading || post == null) return;

    setState(() {
      isVoteLoading = true;
    });

    try {
      if (currentVote == voteType) {
        // Remove vote if clicking the same button
        await _communityService.removeVote(post!['id']);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Vote removed successfully'),
              duration: Duration(seconds: 2),
            ),
          );
        }

        setState(() {
          currentVote = null;
          if (voteType == 'up') {
            post!['upvote_count'] = (post!['upvote_count'] ?? 1) - 1;
          } else {
            post!['downvote_count'] = (post!['downvote_count'] ?? 1) - 1;
          }
        });
      } else {
        // Add or change vote
        await _communityService.votePost(post!['id'], voteType);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                voteType == 'up' ? 'Post upvoted!' : 'Post downvoted!',
              ),
              duration: const Duration(seconds: 2),
            ),
          );
        }

        setState(() {
          // If there was a previous vote, decrement its count
          if (currentVote != null) {
            if (currentVote == 'up') {
              post!['upvote_count'] = (post!['upvote_count'] ?? 1) - 1;
            } else {
              post!['downvote_count'] = (post!['downvote_count'] ?? 1) - 1;
            }
          }

          // Increment the new vote count
          if (voteType == 'up') {
            post!['upvote_count'] = (post!['upvote_count'] ?? 0) + 1;
          } else {
            post!['downvote_count'] = (post!['downvote_count'] ?? 0) + 1;
          }
          currentVote = voteType;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            duration: const Duration(seconds: 3),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          isVoteLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
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
              const Text('Post not found', style: TextStyle(fontSize: 18)),
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
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            Navigator.of(
              context,
            ).pop(true); // Return true to indicate changes were made
          },
        ),
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
                    children:
                        (post!['tags'] as List)
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
                        IconButton(
                          icon: Icon(
                            Icons.favorite,
                            color: currentVote == 'up' ? Colors.red : null,
                          ),
                          onPressed:
                              isVoteLoading
                                  ? null
                                  : () => _handleVote(
                                    'up',
                                  ), // Remove the navigation
                        ),
                        Text('${post!['upvote_count'] ?? 0}'),
                        const SizedBox(width: 16),
                        IconButton(
                          icon: Icon(
                            Icons.thumb_down,
                            color: currentVote == 'down' ? Colors.blue : null,
                          ),
                          onPressed:
                              isVoteLoading
                                  ? null
                                  : () => _handleVote(
                                    'down',
                                  ), // Remove the navigation
                        ),
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
                const Text(
                  'Comments',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const SizedBox(height: 8),
                _buildCommentsSection(), // Call method to build comments UI
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
                    icon:
                        _isSubmittingComment
                            ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                            : const Icon(Icons.send),
                    onPressed: _isSubmittingComment ? null : _submitComment,
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

  // Helper widget to build the comments section
  Widget _buildCommentsSection() {
    if (_isCommentsLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_commentsError != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Error loading comments: $_commentsError'),
            ElevatedButton(
              onPressed: _loadComments,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_comments.isEmpty) {
      return const Center(child: Text('No comments yet. Be the first!'));
    }

    // Use ListView.separated for dividers between comments
    return ListView.separated(
      shrinkWrap: true, // Important inside another ListView
      physics: const NeverScrollableScrollPhysics(), // Disable scrolling
      itemCount: _comments.length,
      itemBuilder: (context, index) {
        final commentData = _comments[index];
        // Create ForumComment on the fly for CommentCard
        final comment = ForumComment.fromJson(commentData);
        final authorUsername =
            commentData['author_username'] ?? 'Unknown'; // Get username

        return CommentCard(
          comment: comment,
          authorUsername: authorUsername, // Pass username
          communityService: _communityService, // Pass service instance
          currentUserId: _currentUserId, // Pass current user ID
          onDelete: () => _deleteComment(comment.id), // Pass delete callback
          onVoteChanged: () {
            // Optionally refresh specific comment state or reload all
            _loadComments();
          },
        );
      },
      separatorBuilder: (context, index) => const Divider(),
    );
  }
}

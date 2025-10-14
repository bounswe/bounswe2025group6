import 'dart:convert';
import 'package:flutter/material.dart';
import '../../models/report.dart';
import '../../services/community_service.dart';
import '../../services/storage_service.dart';
import '../../widgets/report_dialog.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({Key? key}) : super(key: key);

  static const routeName = '/community';

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final CommunityService _communityService = CommunityService();
  List<Map<String, dynamic>> _posts = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _communityService.getPosts();
      setState(() {
        _posts = List<Map<String, dynamic>>.from(response['results']);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Community'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => Navigator.pushNamed(context, '/community/create')
                .then((_) => _loadPosts()),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadPosts,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Text(_error!))
                : ListView.builder(
                    itemCount: _posts.length,
                    itemBuilder: (context, index) {
                      final post = _posts[index];
                      return PostCard(
                        post: post,
                        onVoteChanged: _loadPosts, // Pass the refresh callback
                        onTap: () async {
                          final result = await Navigator.pushNamed(
                            context,
                            '/community/detail',
                            arguments: post['id'],
                          );
                          // Refresh posts if changes were made in detail screen
                          if (result == true) {
                            _loadPosts();
                          }
                        },
                      );
                    },
                  ),
      ),
    );
  }
}

class PostCard extends StatefulWidget {
  final Map<String, dynamic> post;
  final Function? onVoteChanged;
  final Function? onTap;

  const PostCard({
    Key? key, 
    required this.post,
    this.onVoteChanged,
    this.onTap,
  }) : super(key: key);

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  final CommunityService _communityService = CommunityService();
  String? currentVote;
  bool isLoading = false;
  int? _currentUserId;

  @override
  void initState() {
    super.initState();
    _loadVoteStatus();
    _loadCurrentUserId();
  }

  Future<void> _loadCurrentUserId() async {
    final token = await StorageService.getJwtAccessToken();
    if (token != null) {
      try {
        final parts = token.split('.');
        if (parts.length != 3) return;
        final payload = jsonDecode(
          utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
        );
        if (mounted) {
          setState(() {
            _currentUserId = payload['user_id'] as int?;
          });
        }
      } catch (e) {
        // Handle error silently
      }
    }
  }

  Future<void> _loadVoteStatus() async {
    try {
      final vote = await _communityService.getUserVote(widget.post['id']);
      if (mounted) {
        setState(() {
          currentVote = vote?['vote_type'];
        });
      }
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> _handleVote(String voteType) async {
    if (isLoading) return;

    setState(() {
      isLoading = true;
    });

    try {
      if (currentVote == voteType) {
        // Remove vote if clicking the same button
        await _communityService.removeVote(widget.post['id']);
        
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
            widget.post['upvote_count'] = (widget.post['upvote_count'] ?? 1) - 1;
          } else {
            widget.post['downvote_count'] = (widget.post['downvote_count'] ?? 1) - 1;
          }
        });
      } else {
        // Add or change vote
        await _communityService.votePost(widget.post['id'], voteType);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(voteType == 'up' ? 'Post upvoted!' : 'Post downvoted!'),
              duration: const Duration(seconds: 2),
            ),
          );
        }

        setState(() {
          // If there was a previous vote, decrement its count
          if (currentVote != null) {
            if (currentVote == 'up') {
              widget.post['upvote_count'] = (widget.post['upvote_count'] ?? 1) - 1;
            } else {
              widget.post['downvote_count'] = (widget.post['downvote_count'] ?? 1) - 1;
            }
          }
          
          // Increment the new vote count
          if (voteType == 'up') {
            widget.post['upvote_count'] = (widget.post['upvote_count'] ?? 0) + 1;
          } else {
            widget.post['downvote_count'] = (widget.post['downvote_count'] ?? 0) + 1;
          }
          currentVote = voteType;
        });
      }
      
      // Notify parent to refresh posts
      if (widget.onVoteChanged != null) {
        widget.onVoteChanged!();
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
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Check if this is the current user's post
    final isOwnPost = _currentUserId != null && 
                      widget.post['author_id'] == _currentUserId;

    return Card(
      margin: const EdgeInsets.all(8.0),
      child: InkWell(
        onTap: () => widget.onTap?.call(),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      widget.post['title'] ?? '',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  // Show report icon for other users' posts
                  if (!isOwnPost && _currentUserId != null)
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert),
                      itemBuilder: (context) => [
                        PopupMenuItem<String>(
                          value: 'report',
                          child: const Row(
                            children: [
                              Icon(Icons.flag_outlined, color: Colors.red),
                              SizedBox(width: 8),
                              Text('Report Post'),
                            ],
                          ),
                          onTap: () async {
                            // Wait for menu to close
                            await Future.delayed(const Duration(milliseconds: 100));
                            if (!context.mounted) return;
                            
                            await ReportDialog.show(
                              context: context,
                              contentType: ReportContentType.post,
                              objectId: widget.post['id'],
                              contentPreview: widget.post['title'] ?? 'Post',
                            );
                          },
                        ),
                      ],
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                widget.post['content'] ?? '',
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              // Tags section
              if (widget.post['tags'] != null && (widget.post['tags'] as List).isNotEmpty)
                Wrap(
                  spacing: 8,
                  children: (widget.post['tags'] as List)
                      .map((tag) => Chip(
                            label: Text(tag.toString()),
                            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ))
                      .toList(),
                ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('By ${widget.post['author']?.toString() ?? 'Unknown'}'),
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          Icons.favorite,
                          size: 16,
                          color: currentVote == 'up' ? Colors.red : null,
                        ),
                        onPressed: isLoading ? null : () => _handleVote('up'),
                      ),
                      Text('${widget.post['upvote_count'] ?? 0}'),
                      const SizedBox(width: 16),
                      IconButton(
                        icon: Icon(
                          Icons.thumb_down,
                          size: 16,
                          color: currentVote == 'down' ? Colors.blue : null,
                        ),
                        onPressed: isLoading ? null : () => _handleVote('down'),
                      ),
                      Text('${widget.post['downvote_count'] ?? 0}'),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
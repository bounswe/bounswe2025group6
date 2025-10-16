import 'package:flutter/material.dart';
import '../models/forum_comment.dart';
import '../models/report.dart';
import '../services/community_service.dart';
import 'report_dialog.dart';

class CommentCard extends StatefulWidget {
  final ForumComment comment;
  final String authorUsername;
  final CommunityService communityService;
  final int? currentUserId;
  final VoidCallback onDelete;
  final VoidCallback onVoteChanged;

  const CommentCard({
    Key? key,
    required this.comment,
    required this.authorUsername,
    required this.communityService,
    required this.currentUserId,
    required this.onDelete,
    required this.onVoteChanged,
  }) : super(key: key);

  @override
  State<CommentCard> createState() => _CommentCardState();
}

class _CommentCardState extends State<CommentCard> {
  String? currentVote;
  bool isVoteLoading = false;
  late int upvoteCount;
  late int downvoteCount;

  @override
  void initState() {
    super.initState();
    upvoteCount = widget.comment.upvoteCount;
    downvoteCount = widget.comment.downvoteCount;
    _loadVoteStatus();
  }

  Future<void> _loadVoteStatus() async {
    // Avoid unnecessary loading if not logged in
    if (widget.currentUserId == null) return;

    setState(() {
      isVoteLoading = true; // Indicate loading starts
    });
    try {
      final vote = await widget.communityService.getUserCommentVote(
        widget.comment.id,
      );
      if (mounted) {
        setState(() {
          currentVote = vote?['vote_type'];
          isVoteLoading = false; // Indicate loading finished
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          isVoteLoading = false; // Indicate loading finished even on error
        });
        // Optionally show a subtle error or log it
        print('Error loading comment vote status: $e');
      }
    }
  }

  Future<void> _handleVote(String voteType) async {
    if (isVoteLoading) return;
    if (widget.currentUserId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please log in to vote.')));
      return;
    }

    setState(() {
      isVoteLoading = true;
    });

    print(
      'Attempting to vote on comment ID: ${widget.comment.id} with type: $voteType',
    ); // Add logging

    try {
      String? previousVote = currentVote;

      if (currentVote == voteType) {
        // Remove vote
        await widget.communityService.removeCommentVote(widget.comment.id);
        if (mounted) {
          setState(() {
            currentVote = null;
            if (voteType == 'up') {
              upvoteCount--;
            } else {
              downvoteCount--;
            }
          });
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Vote removed')));
        }
      } else {
        // Add or change vote
        await widget.communityService.voteComment(widget.comment.id, voteType);
        if (mounted) {
          setState(() {
            // Decrement previous vote count if exists
            if (previousVote == 'up') {
              upvoteCount--;
            } else if (previousVote == 'down') {
              downvoteCount--;
            }
            // Increment new vote count
            if (voteType == 'up') {
              upvoteCount++;
            } else {
              downvoteCount++;
            }
            currentVote = voteType;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                voteType == 'up' ? 'Comment upvoted!' : 'Comment downvoted!',
              ),
            ),
          );
        }
      }
      widget.onVoteChanged(); // Notify parent
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Vote failed: ${e.toString()}'),
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

  String _formatDateTime(String? dateTimeStr) {
    if (dateTimeStr == null) return '';
    try {
      final dateTime = DateTime.parse(dateTimeStr).toLocal();
      // More detailed format
      return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'Invalid date'; // Handle parsing errors
    }
  }

  Future<void> _showReportDialog(BuildContext context) async {
    await ReportDialog.show(
      context: context,
      contentType: ReportContentType.postcomment,
      objectId: widget.comment.id,
      contentPreview: widget.comment.content.length > 50
          ? '${widget.comment.content.substring(0, 50)}...'
          : widget.comment.content,
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isAuthor = widget.currentUserId == widget.comment.author;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'By ${widget.authorUsername}', // Use fetched username
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
              ),
              // Show delete button for own comments
              if (isAuthor)
                IconButton(
                  icon: const Icon(Icons.delete_outline, size: 20),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  tooltip: 'Delete Comment',
                  onPressed: widget.onDelete,
                ),
              // Show report button for other users' comments
              if (!isAuthor && widget.currentUserId != null)
                IconButton(
                  icon: const Icon(Icons.flag_outlined, size: 20),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  tooltip: 'Report Comment',
                  onPressed: () => _showReportDialog(context),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(widget.comment.content),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _formatDateTime(widget.comment.createdAt),
                style: Theme.of(context).textTheme.bodySmall,
              ),
              Row(
                children: [
                  IconButton(
                    icon: Icon(
                      Icons.thumb_up_alt_outlined,
                      size: 18,
                      color:
                          currentVote == 'up'
                              ? Theme.of(context).colorScheme.primary
                              : null,
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    tooltip: 'Upvote',
                    onPressed: isVoteLoading ? null : () => _handleVote('up'),
                  ),
                  const SizedBox(width: 4),
                  Text('$upvoteCount'),
                  const SizedBox(width: 16),
                  IconButton(
                    icon: Icon(
                      Icons.thumb_down_alt_outlined,
                      size: 18,
                      color:
                          currentVote == 'down'
                              ? Theme.of(context).colorScheme.secondary
                              : null,
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    tooltip: 'Downvote',
                    onPressed: isVoteLoading ? null : () => _handleVote('down'),
                  ),
                  const SizedBox(width: 4),
                  Text('$downvoteCount'),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

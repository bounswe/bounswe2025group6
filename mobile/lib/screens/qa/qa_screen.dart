import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/qa_service.dart';
import '../../services/storage_service.dart';
import '../../services/profile_service.dart';
import '../../widgets/badge_widget.dart';
import '../../l10n/app_localizations.dart';
import '../../utils/tag_localization.dart';
import '../other_user_profile_screen.dart';

class QAScreen extends StatefulWidget {
  const QAScreen({Key? key}) : super(key: key);

  static const routeName = '/qa';

  @override
  State<QAScreen> createState() => _QAScreenState();
}

class _QAScreenState extends State<QAScreen> {
  final QAService _qaService = QAService();
  List<Map<String, dynamic>> _questions = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final token = await StorageService.getJwtAccessToken();
      _qaService.token = token;
      
      final response = await _qaService.getQuestions();
      setState(() {
        _questions = List<Map<String, dynamic>>.from(response['results']);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().contains('Invalid response from server')
            ? 'The Q&A feature is not available. Please ensure the backend has been set up correctly.'
            : e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Q&A'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => Navigator.pushNamed(
              context,
              '/qa/create',
            ).then((_) => _loadQuestions()),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadQuestions,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Text(_error!))
                : ListView.builder(
                    itemCount: _questions.length,
                    itemBuilder: (context, index) {
                      final question = _questions[index];
                      return QuestionCard(
                        question: question,
                        onVoteChanged: _loadQuestions,
                        onTap: () async {
                          await Navigator.pushNamed(
                            context,
                            '/qa/detail',
                            arguments: question['id'],
                          );
                          // Always reload to update view count and any other changes
                          _loadQuestions();
                        },
                      );
                    },
                  ),
      ),
    );
  }
}

class QuestionCard extends StatefulWidget {
  final Map<String, dynamic> question;
  final Function? onVoteChanged;
  final Function? onTap;

  const QuestionCard({
    Key? key,
    required this.question,
    this.onVoteChanged,
    this.onTap,
  }) : super(key: key);

  @override
  State<QuestionCard> createState() => _QuestionCardState();
}

class _QuestionCardState extends State<QuestionCard> {
  final QAService _qaService = QAService();
  final ProfileService _profileService = ProfileService();
  String? currentVote;
  bool isLoading = false;
  int? _currentUserId;
  String? _authorBadge;

  @override
  void initState() {
    super.initState();
    _loadVoteStatus();
    _loadCurrentUserId();
    _loadAuthorBadge();
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
      final token = await StorageService.getJwtAccessToken();
      _qaService.token = token;
      final vote = await _qaService.getQuestionVote(widget.question['id']);
      if (mounted) {
        setState(() {
          currentVote = vote?['vote_type'];
        });
      }
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> _loadAuthorBadge() async {
    final authorId = widget.question['author_id'] as int?;
    if (authorId == null) return;

    try {
      final badgeData = await _profileService.getRecipeCountBadge(authorId);
      if (mounted) {
        setState(() {
          _authorBadge = badgeData?['badge'];
        });
      }
    } catch (_) {
      // Silent fail - just don't show badge
    }
  }

  Future<void> _handleVote(String voteType) async {
    if (isLoading) return;

    setState(() {
      isLoading = true;
    });

    try {
      final token = await StorageService.getJwtAccessToken();
      _qaService.token = token;

      if (currentVote == voteType) {
        // Remove vote if clicking the same button
        await _qaService.removeQuestionVote(widget.question['id']);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Vote removed'),
              duration: Duration(seconds: 2),
            ),
          );
        }

        setState(() {
          currentVote = null;
        });
      } else {
        if (currentVote != null) {
          // Remove existing vote first
          await _qaService.removeQuestionVote(widget.question['id']);
        }
        // Add new vote
        await _qaService.voteQuestion(widget.question['id'], voteType);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Voted ${voteType == 'up' ? 'up' : 'down'}'),
              duration: const Duration(seconds: 2),
            ),
          );
        }

        setState(() {
          currentVote = voteType;
        });
      }

      if (widget.onVoteChanged != null) {
        widget.onVoteChanged!();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
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

  void _navigateToProfile() {
    final authorId = widget.question['author_id'] as int?;
    if (authorId == null) return;

    if (_currentUserId != null && _currentUserId == authorId) {
      Navigator.pushNamed(context, '/profile');
    } else {
      Navigator.pushNamed(
        context,
        OtherUserProfileScreen.routeName,
        arguments: authorId,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: widget.onTap != null ? () => widget.onTap!() : null,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Author and Badge
              GestureDetector(
                onTap: _navigateToProfile,
                child: Row(
                  children: [
                    Text(
                      widget.question['author'] ?? 'Unknown',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.primaryColor,
                      ),
                    ),
                    if (_authorBadge != null) ...[
                      const SizedBox(width: 8),
                      BadgeWidget(badge: _authorBadge!),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Title
              Text(
                widget.question['title'] ?? '',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),

              // Content preview
              Text(
                widget.question['content'] ?? '',
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),

              // Tags
              if (widget.question['tags'] != null &&
                  (widget.question['tags'] as List).isNotEmpty)
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: (widget.question['tags'] as List<dynamic>)
                      .map((tag) => Chip(
                            label: Text(
                              tag.toString(),
                              style: theme.textTheme.bodySmall,
                            ),
                            backgroundColor:
                                theme.primaryColor.withOpacity(0.1),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 0,
                            ),
                            materialTapTargetSize:
                                MaterialTapTargetSize.shrinkWrap,
                          ))
                      .toList(),
                ),
              const SizedBox(height: 12),

              // Stats and Vote buttons
              Row(
                children: [
                  // Upvote
                  IconButton(
                    icon: Icon(
                      Icons.arrow_upward,
                      color: currentVote == 'up'
                          ? Colors.green
                          : theme.iconTheme.color,
                    ),
                    onPressed: isLoading ? null : () => _handleVote('up'),
                  ),
                  Text('${widget.question['upvote_count'] ?? 0}'),
                  const SizedBox(width: 8),

                  // Downvote
                  IconButton(
                    icon: Icon(
                      Icons.arrow_downward,
                      color: currentVote == 'down'
                          ? Colors.red
                          : theme.iconTheme.color,
                    ),
                    onPressed: isLoading ? null : () => _handleVote('down'),
                  ),
                  Text('${widget.question['downvote_count'] ?? 0}'),
                  const SizedBox(width: 16),

                  // Views
                  Icon(Icons.visibility,
                      size: 18, color: theme.iconTheme.color),
                  const SizedBox(width: 4),
                  Text('${widget.question['view_count'] ?? 0}'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

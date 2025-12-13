import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/qa_service.dart';
import '../../services/profile_service.dart';
import '../../services/storage_service.dart';
import '../../utils/date_formatter.dart';
import '../../models/user_profile.dart';
import '../../widgets/badge_widget.dart';
import '../../l10n/app_localizations.dart';
import '../../utils/tag_localization.dart';
import '../other_user_profile_screen.dart';

class QADetailScreen extends StatefulWidget {
  const QADetailScreen({Key? key}) : super(key: key);

  static const routeName = '/qa/detail';

  @override
  State<QADetailScreen> createState() => _QADetailScreenState();
}

class _QADetailScreenState extends State<QADetailScreen> {
  final _answerController = TextEditingController();
  Map<String, dynamic>? question;
  bool _isLoading = true;
  final QAService _qaService = QAService();
  final ProfileService _profileService = ProfileService();
  String? currentVote;
  bool isVoteLoading = false;
  String? _authorBadge;
  List<Map<String, dynamic>> _answers = [];
  bool _isAnswersLoading = false;
  bool _isSubmittingAnswer = false;
  int? _currentUserId;
  DateFormat? _userDateFormat;
  bool _isDietitian = false;

  @override
  void initState() {
    super.initState();
    _initializeQuestion();
    _loadCurrentUserId();
    _loadUserPreferences();
  }

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  Future<void> _loadUserPreferences() async {
    try {
      final profile = await _profileService.getUserProfile();
      if (mounted) {
        setState(() {
          _userDateFormat = profile.preferredDateFormat;
          _isDietitian = profile.userType == 'dietitian';
        });
      }
    } catch (e) {
      print('Could not load user preferences: $e');
    }
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
        print('Error decoding token: $e');
      }
    }
  }

  Future<void> _initializeQuestion() async {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final questionId = ModalRoute.of(context)?.settings.arguments as int?;
      if (questionId != null) {
        try {
          final token = await StorageService.getJwtAccessToken();
          _qaService.token = token;

          final questionDetail = await _qaService.getQuestionDetail(questionId);
          if (mounted) {
            setState(() {
              question = questionDetail;
              _isLoading = false;
            });
            _loadVoteStatus();
            _loadAnswers();
            _loadAuthorBadge();
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
    final localizations = AppLocalizations.of(context)!;
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder:
          (context) => AlertDialog(
            title: Text(localizations.deleteQuestion),
            content: Text(localizations.deleteQuestionConfirm),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: Text(localizations.cancel),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: Text(
                  localizations.delete,
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            ],
          ),
    );

    if (shouldDelete == true && mounted) {
      try {
        await _qaService.deleteQuestion(question!['id']);
        if (!mounted) return;
        Navigator.of(context).pop(true);
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  String _formatDateTime(String? dateTimeStr) {
    return DateFormatter.formatDateString(
      dateTimeStr,
      preferredFormat: _userDateFormat,
      includeTime: true,
    );
  }

  Future<void> _loadVoteStatus() async {
    if (question == null) return;

    try {
      final vote = await _qaService.getQuestionVote(question!['id']);
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
    final authorId = question?['author_id'] as int?;
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

  Future<void> _loadAnswers() async {
    if (question == null) return;

    setState(() {
      _isAnswersLoading = true;
    });

    try {
      final token = await StorageService.getJwtAccessToken();
      _qaService.token = token;

      final response = await _qaService.getAnswers(questionId: question!['id']);
      if (mounted) {
        setState(() {
          _answers = List<Map<String, dynamic>>.from(response['results']);
          _isAnswersLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _answers = [];
          _isAnswersLoading = false;
        });
      }
    }
  }

  Future<void> _handleVote(String voteType) async {
    if (isVoteLoading || question == null) return;

    setState(() {
      isVoteLoading = true;
    });

    try {
      if (currentVote == voteType) {
        await _qaService.removeQuestionVote(question!['id']);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context)!.voteRemoved),
              duration: const Duration(seconds: 2),
            ),
          );
        }
        setState(() {
          currentVote = null;
        });
      } else {
        if (currentVote != null) {
          await _qaService.removeQuestionVote(question!['id']);
        }
        await _qaService.voteQuestion(question!['id'], voteType);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(voteType == 'up' 
                  ? AppLocalizations.of(context)!.votedUp 
                  : AppLocalizations.of(context)!.votedDown),
              duration: const Duration(seconds: 2),
            ),
          );
        }
        setState(() {
          currentVote = voteType;
        });
      }
      _initializeQuestion();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    } finally {
      if (mounted) {
        setState(() {
          isVoteLoading = false;
        });
      }
    }
  }

  Future<void> _submitAnswer() async {
    if (_answerController.text.trim().isEmpty) return;
    if (!_isDietitian) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.onlyDietitiansCanAnswer)),
      );
      return;
    }

    setState(() {
      _isSubmittingAnswer = true;
    });

    try {
      await _qaService.createAnswer(
        questionId: question!['id'],
        content: _answerController.text.trim(),
      );

      if (mounted) {
        _answerController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.answerSubmittedSuccess)),
        );
        _loadAnswers();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context)!.error(e.toString()))));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmittingAnswer = false;
        });
      }
    }
  }

  void _navigateToProfile(int? authorId) {
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
    final localizations = AppLocalizations.of(context)!;

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text(localizations.qaTitle)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (question == null) {
      return Scaffold(
        appBar: AppBar(title: Text(localizations.qaTitle)),
        body: Center(child: Text(localizations.questionNotFound)),
      );
    }

    final isAuthor =
        _currentUserId != null && _currentUserId == question!['author_id'];

    return Scaffold(
      appBar: AppBar(
        title: Text(localizations.qaTitle),
        actions: [
          if (isAuthor)
            PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'delete') {
                  _showDeleteConfirmation();
                }
              },
              itemBuilder:
                  (context) => [
                    PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          const Icon(Icons.delete, color: Colors.red),
                          const SizedBox(width: 8),
                          Text(localizations.delete, style: const TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ],
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Question Card
            Card(
              margin: const EdgeInsets.all(16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Author
                    GestureDetector(
                      onTap: () => _navigateToProfile(question!['author_id']),
                      child: Row(
                        children: [
                          Text(
                            question!['author'] ?? 'Unknown',
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
                    const SizedBox(height: 8),
                    Text(
                      _formatDateTime(question!['created_at']),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Title
                    Text(
                      question!['title'] ?? '',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Content
                    Text(
                      question!['content'] ?? '',
                      style: theme.textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),

                    // Tags
                    if (question!['tags'] != null &&
                        (question!['tags'] as List).isNotEmpty)
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children:
                            (question!['tags'] as List<dynamic>)
                                .map(
                                  (tag) => Chip(
                                    label: Text(
                                      tag.toString(),
                                      style: theme.textTheme.bodySmall,
                                    ),
                                    backgroundColor: theme.primaryColor
                                        .withOpacity(0.1),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 0,
                                    ),
                                    materialTapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                  ),
                                )
                                .toList(),
                      ),
                    const SizedBox(height: 16),

                    // Stats and Vote buttons
                    Row(
                      children: [
                        // Upvote
                        IconButton(
                          icon: Icon(
                            Icons.arrow_upward,
                            color:
                                currentVote == 'up'
                                    ? Colors.green
                                    : theme.iconTheme.color,
                          ),
                          onPressed:
                              isVoteLoading ? null : () => _handleVote('up'),
                        ),
                        Text('${question!['upvote_count'] ?? 0}'),
                        const SizedBox(width: 8),

                        // Downvote
                        IconButton(
                          icon: Icon(
                            Icons.arrow_downward,
                            color:
                                currentVote == 'down'
                                    ? Colors.red
                                    : theme.iconTheme.color,
                          ),
                          onPressed:
                              isVoteLoading ? null : () => _handleVote('down'),
                        ),
                        Text('${question!['downvote_count'] ?? 0}'),
                        const SizedBox(width: 16),

                        // Views
                        Icon(
                          Icons.visibility,
                          size: 18,
                          color: theme.iconTheme.color,
                        ),
                        const SizedBox(width: 4),
                        Text('${question!['view_count'] ?? 0}'),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Answers Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                localizations.answersCount(_answers.length.toString()),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 8),

            // Answers List
            if (_isAnswersLoading)
              const Center(child: CircularProgressIndicator())
            else if (_answers.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Text(localizations.noAnswersYet),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _answers.length,
                itemBuilder: (context, index) {
                  return AnswerCard(
                    answer: _answers[index],
                    onVoteChanged: _loadAnswers,
                    currentUserId: _currentUserId,
                    userDateFormat: _userDateFormat,
                    navigateToProfile: _navigateToProfile,
                  );
                },
              ),

            // Answer Input (only for dietitians)
            if (_isDietitian && question!['is_commentable'] == true)
              Card(
                margin: const EdgeInsets.all(16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        localizations.yourAnswer,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _answerController,
                        maxLines: 5,
                        decoration: InputDecoration(
                          hintText: localizations.writeAnswerHint,
                          border: const OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isSubmittingAnswer ? null : _submitAnswer,
                          child:
                              _isSubmittingAnswer
                                  ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                  : Text(localizations.submitAnswer),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class AnswerCard extends StatefulWidget {
  final Map<String, dynamic> answer;
  final Function? onVoteChanged;
  final int? currentUserId;
  final DateFormat? userDateFormat;
  final Function(int?) navigateToProfile;

  const AnswerCard({
    Key? key,
    required this.answer,
    this.onVoteChanged,
    this.currentUserId,
    this.userDateFormat,
    required this.navigateToProfile,
  }) : super(key: key);

  @override
  State<AnswerCard> createState() => _AnswerCardState();
}

class _AnswerCardState extends State<AnswerCard> {
  final QAService _qaService = QAService();
  final ProfileService _profileService = ProfileService();
  String? currentVote;
  bool isLoading = false;
  String? _authorBadge;

  @override
  void initState() {
    super.initState();
    _loadVoteStatus();
    _loadAuthorBadge();
  }

  Future<void> _loadVoteStatus() async {
    try {
      final token = await StorageService.getJwtAccessToken();
      _qaService.token = token;
      final vote = await _qaService.getAnswerVote(widget.answer['id']);
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
    final authorId = widget.answer['author_id'] as int?;
    if (authorId == null) return;

    try {
      final badgeData = await _profileService.getRecipeCountBadge(authorId);
      if (mounted) {
        setState(() {
          _authorBadge = badgeData?['badge'];
        });
      }
    } catch (_) {
      // Silent fail
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
        await _qaService.removeAnswerVote(widget.answer['id']);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context)!.voteRemoved),
              duration: const Duration(seconds: 2),
            ),
          );
        }
        setState(() {
          currentVote = null;
        });
      } else {
        if (currentVote != null) {
          await _qaService.removeAnswerVote(widget.answer['id']);
        }
        await _qaService.voteAnswer(widget.answer['id'], voteType);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(voteType == 'up' 
                  ? AppLocalizations.of(context)!.votedUp 
                  : AppLocalizations.of(context)!.votedDown),
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
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
      }
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  String _formatDateTime(String? dateTimeStr) {
    return DateFormatter.formatDateString(
      dateTimeStr,
      preferredFormat: widget.userDateFormat,
      includeTime: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Author
            GestureDetector(
              onTap: () => widget.navigateToProfile(widget.answer['author_id']),
              child: Row(
                children: [
                  Text(
                    widget.answer['author'] ?? 'Unknown',
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
            const SizedBox(height: 8),
            Text(
              _formatDateTime(widget.answer['created_at']),
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
            ),
            const SizedBox(height: 12),

            // Content
            Text(
              widget.answer['content'] ?? '',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 12),

            // Vote buttons
            Row(
              children: [
                IconButton(
                  icon: Icon(
                    Icons.arrow_upward,
                    color:
                        currentVote == 'up'
                            ? Colors.green
                            : theme.iconTheme.color,
                  ),
                  onPressed: isLoading ? null : () => _handleVote('up'),
                ),
                Text('${widget.answer['upvote_count'] ?? 0}'),
                const SizedBox(width: 8),
                IconButton(
                  icon: Icon(
                    Icons.arrow_downward,
                    color:
                        currentVote == 'down'
                            ? Colors.red
                            : theme.iconTheme.color,
                  ),
                  onPressed: isLoading ? null : () => _handleVote('down'),
                ),
                Text('${widget.answer['downvote_count'] ?? 0}'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

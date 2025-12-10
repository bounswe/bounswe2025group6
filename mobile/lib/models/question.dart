class Question {
  final int id;
  final String title;
  final String content;
  final bool isCommentable;
  final int author;
  final int viewCount;
  final int upvoteCount;
  final int downvoteCount;
  final List<String> tags;
  final String createdAt;
  final String updatedAt;
  final String? deletedOn;

  Question({
    required this.id,
    required this.title,
    required this.content,
    required this.isCommentable,
    required this.author,
    required this.viewCount,
    required this.upvoteCount,
    required this.downvoteCount,
    required this.tags,
    required this.createdAt,
    required this.updatedAt,
    this.deletedOn,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'] as int,
      title: json['title'] as String,
      content: json['content'] as String,
      isCommentable: json['is_commentable'] as bool? ?? true,
      author: json['author'] as int,
      viewCount: json['view_count'] as int? ?? 0,
      upvoteCount: json['upvote_count'] as int? ?? 0,
      downvoteCount: json['downvote_count'] as int? ?? 0,
      tags: List<String>.from(json['tags'] ?? []),
      createdAt: json['created_at'] as String,
      updatedAt: json['updated_at'] as String,
      deletedOn: json['deleted_on'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'is_commentable': isCommentable,
      'author': author,
      'view_count': viewCount,
      'upvote_count': upvoteCount,
      'downvote_count': downvoteCount,
      'tags': tags,
      'created_at': createdAt,
      'updated_at': updatedAt,
      'deleted_on': deletedOn,
    };
  }
}

class ForumComment {
  final int id;
  final String content;
  final int author; // Assuming author is represented by ID for now
  final int upvoteCount;
  final int downvoteCount;
  final int reportedCount;
  final String createdAt;
  final String updatedAt;
  final String? deletedOn;

  ForumComment({
    required this.id,
    required this.content,
    required this.author,
    required this.upvoteCount,
    required this.downvoteCount,
    required this.reportedCount,
    required this.createdAt,
    required this.updatedAt,
    this.deletedOn,
  });

  factory ForumComment.fromJson(Map<String, dynamic> json) {
    return ForumComment(
      id: json['id'] as int,
      content: json['content'] as String,
      author: json['author'] as int,
      upvoteCount: json['upvote_count'] as int? ?? 0, // Handle potential nulls
      downvoteCount:
          json['downvote_count'] as int? ?? 0, // Handle potential nulls
      reportedCount:
          json['reported_count'] as int? ?? 0, // Handle potential nulls
      createdAt: json['created_at'] as String,
      updatedAt: json['updated_at'] as String,
      deletedOn: json['deleted_on'] as String?,
    );
  }
}

class Answer {
  final int id;
  final String content;
  final int author;
  final int upvoteCount;
  final int downvoteCount;
  final int reportedCount;
  final String createdAt;
  final String updatedAt;
  final String? deletedOn;

  Answer({
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

  factory Answer.fromJson(Map<String, dynamic> json) {
    return Answer(
      id: json['id'] as int,
      content: json['content'] as String,
      author: json['author'] as int,
      upvoteCount: json['upvote_count'] as int? ?? 0,
      downvoteCount: json['downvote_count'] as int? ?? 0,
      reportedCount: json['reported_count'] as int? ?? 0,
      createdAt: json['created_at'] as String,
      updatedAt: json['updated_at'] as String,
      deletedOn: json['deleted_on'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'author': author,
      'upvote_count': upvoteCount,
      'downvote_count': downvoteCount,
      'reported_count': reportedCount,
      'created_at': createdAt,
      'updated_at': updatedAt,
      'deleted_on': deletedOn,
    };
  }
}

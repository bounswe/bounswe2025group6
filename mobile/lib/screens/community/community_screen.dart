import 'package:flutter/material.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({Key? key}) : super(key: key);

  static const routeName = '/community';

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final List<Map<String, dynamic>> _posts = [
    {
      'id': '1',
      'title': 'Best Pre-workout Meals',
      'content': 'What do you eat before working out?',
      'author': 'JohnDoe',
      'likes': 15,
      'comments': 5,
      'timestamp': DateTime.now().subtract(const Duration(hours: 2)),
    },
    // Add more mock posts here
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Community'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => Navigator.pushNamed(context, '/community/create'),
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: _posts.length,
        itemBuilder: (context, index) {
          final post = _posts[index];
          return PostCard(post: post);
        },
      ),
    );
  }
}

class PostCard extends StatelessWidget {
  final Map<String, dynamic> post;

  const PostCard({Key? key, required this.post}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8.0),
      child: InkWell(
        onTap: () => Navigator.pushNamed(
          context,
          '/community/detail',
          arguments: post,
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                post['title'],
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(post['content']),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('By ${post['author']}'),
                  Row(
                    children: [
                      Icon(Icons.favorite, size: 16),
                      Text('${post['likes']}'),
                      const SizedBox(width: 8),
                      Icon(Icons.comment, size: 16),
                      Text('${post['comments']}'),
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
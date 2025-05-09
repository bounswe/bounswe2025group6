import 'package:flutter/material.dart';

class PostDetailScreen extends StatefulWidget {
  const PostDetailScreen({Key? key}) : super(key: key);

  static const routeName = '/community/detail';

  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  final _commentController = TextEditingController();
  late Map<String, dynamic> post;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>;
      setState(() {
        post = args;
      });
    });
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Post Detail'),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                Text(
                  post['title'] ?? '',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text(post['content'] ?? ''),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('By ${post['author'] ?? ''}'),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.favorite_border),
                          onPressed: () {
                            // TODO: Implement like functionality
                          },
                        ),
                        Text('${post['likes'] ?? 0}'),
                      ],
                    ),
                  ],
                ),
                const Divider(),
                const Text('Comments', style: TextStyle(fontWeight: FontWeight.bold)),
                // TODO: Add comments list
              ],
            ),
          ),
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
}
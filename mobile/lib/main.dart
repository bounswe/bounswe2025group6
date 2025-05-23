import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/community/community_screen.dart';
import 'screens/community/create_post_screen.dart';
import 'screens/community/post_detail_screen.dart';
import 'screens/community/edit_post_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FitHub',
      theme: AppTheme.lightTheme,
      home: const LoginScreen(),
      routes: {
        ProfileScreen.routeName: (context) => ProfileScreen(),
        '/community': (context) => const CommunityScreen(),
        '/community/create': (context) => const CreatePostScreen(),
        '/community/detail': (context) => const PostDetailScreen(),
        '/community/edit': (context) => EditPostScreen(
          post: ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>,
        ),
      },
    );
  }
}

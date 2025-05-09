import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/profile_screen.dart'; // Import ProfileScreen
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
      routes: {ProfileScreen.routeName: (context) => ProfileScreen()},
    );
  }
}

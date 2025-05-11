import 'package:fithub/screens/forgot_pass_screen.dart';
import 'package:fithub/screens/register_screen.dart';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import 'package:fithub/screens/dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  final AuthService? authService;

  const LoginScreen({this.authService, super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late final AuthService _authService;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _authService = widget.authService ?? AuthService();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            24.0,
            MediaQuery.of(context).padding.top + 24.0,
            24.0,
            24.0,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo
                Center(
                  child: Container(
                    height: 180,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(50.0),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryGreen.withValues(),
                          spreadRadius: 3,
                          blurRadius: 50,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(50.0),
                      child: Image.asset(
                        'assets/images/logo.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 50),

                // Title
                const Text(
                  'Login',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryGreen,
                  ),
                ),

                // Subtitle
                const Text(
                  'Sign in to continue',
                  style: TextStyle(fontSize: 16, color: AppTheme.primaryGreen),
                ),
                const SizedBox(height: 32),

                // Email Field
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'EMAIL',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your email';
                    }
                    // Basic email validation
                    if (!value.contains('@')) {
                      return 'Please enter a valid email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password Field
                TextFormField(
                  controller: _passwordController,
                  keyboardType: TextInputType.visiblePassword,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'PASSWORD',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    }
                    return null;
                  },
                ),

                // Add Forgot Password link immediately after password field
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const ForgotPasswordScreen(),
                        ),
                      );
                    },
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                    ),
                    child: const Text(
                      'Forgot Password?',
                      style: TextStyle(
                        color: AppTheme.primaryGreen,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Login Button
                Center(
                  child:
                      _isLoading
                          ? const CircularProgressIndicator()
                          : ElevatedButton(
                            onPressed: () => logIn(context),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.buttonGrey,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 70,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            child: const Text(
                              'Log In',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                ),

                const SizedBox(height: 24),

                // Create Account link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      "Don't have an account? ",
                      style: TextStyle(color: Colors.grey, fontSize: 14),
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const RegisterPage(),
                          ),
                        );
                      },
                      child: const Text(
                        'Create Account',
                        style: TextStyle(
                          color: Color(0xFF006837),
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showSuccessMessage(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Login successful!'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _showErrorMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Login failed: $message'),
        backgroundColor: Colors.red,
      ),
    );
  }

  Future<void> logIn(BuildContext context) async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      await _authService.login(
        _emailController.text,
        _passwordController.text,
      );

      // Store the original token (likely Django token)
      await StorageService.saveToken(response.token);

      // Also fetch and store the JWT access token
      try {
        final jwtAccessToken = await _authService.getJwtAccessToken(
          _emailController.text,
          _passwordController.text,
        );
        await StorageService.saveJwtAccessToken(jwtAccessToken);
      } catch (e) {
        if (!mounted) return;
        _showErrorMessage(
          context,
          'Failed to obtain JWT token: ${e.toString()}',
        );
      }

      if (!mounted) return;

      _showSuccessMessage(context);

      // Navigate to dashboard and remove all previous routes
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const DashboardScreen()),
        (route) => false,
      );
    } catch (e) {
      if (!mounted) return;
      _showErrorMessage(context, e.toString());
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
} // End of class

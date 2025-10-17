import 'package:fithub/screens/forgot_pass_screen.dart';
import 'package:fithub/screens/register_screen.dart';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import 'package:fithub/screens/dashboard_screen.dart';
import '../l10n/app_localizations.dart'; // Import AppLocalizations
import '../widgets/language_toggle.dart';


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
                  // Language toggle
                  Align(
                    alignment: Alignment.centerRight,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 8.0),
                      child: const LanguageToggle(),
                    ),
                  ),
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
                Text(
                  // 'Login',
                  AppLocalizations.of(context)!.loginTitle,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryGreen,
                  ),
                ),

                // Subtitle
                Text(
                  // 'Sign in to continue',
                  AppLocalizations.of(context)!.signInToContinue,
                  style: TextStyle(fontSize: 16, color: AppTheme.primaryGreen),
                ),
                const SizedBox(height: 32),

                // Email Field
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    // labelText: 'EMAIL',
                    labelText: AppLocalizations.of(context)!.emailLabel,
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return AppLocalizations.of(context)!.pleaseEnterEmail;
                    }
                    // Basic email validation
                    if (!value.contains('@')) {
                      return AppLocalizations.of(context)!.invalidEmail;
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
                  decoration: InputDecoration(
                    // labelText: 'PASSWORD',
                    labelText: AppLocalizations.of(context)!.passwordLabel,
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return AppLocalizations.of(context)!.pleaseEnterPassword;
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
                    child: Text(
                      // 'Forgot Password?',
                      AppLocalizations.of(context)!.forgotPasswordQuestion,
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
                            child: Text(
                            // 'Log In',
                            AppLocalizations.of(context)!.logInButton,
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
                    Text(
                      // "Don't have an account? ",
                      AppLocalizations.of(context)!.dontHaveAccount,
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
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
                      child: Text(
                        // 'Create Account',
                        AppLocalizations.of(context)!.createAccount,
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
      SnackBar(
        content: Text(AppLocalizations.of(context)!.loginSuccessful),
        backgroundColor: AppTheme.successColor,
      ),
    );
  }

  void _showErrorMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLocalizations.of(context)!.loginFailed(message)),
        backgroundColor: AppTheme.errorColor,
      ),
    );
  }

  Future<void> logIn(BuildContext context) async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      // Call login method and get the LoginResponse
      final loginResponse = await _authService.login(
        _emailController.text,
        _passwordController.text,
      );

      // Also fetch and store the JWT access token
      try {
        final jwtTokens = await _authService.getJwtAccessToken(
          _emailController.text,
          _passwordController.text,
        );
        await StorageService.saveJwtAccessToken(jwtTokens['access']!);
        await StorageService.saveRefreshToken(jwtTokens['refresh']!);
      } catch (e) {
        if (!mounted) return;
        // Old hardcoded message preserved for reference:
        // _showErrorMessage(context, 'Failed to obtain JWT tokens: ${e.toString()}');
        // Show a specific localized error message about failing to obtain JWT tokens
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.failedToObtainJwtTokens(e.toString())),
            backgroundColor: AppTheme.errorColor,
          ),
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

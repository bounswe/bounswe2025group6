import 'package:fithub/screens/verify_code_screen.dart';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/auth_service.dart';
import '../l10n/app_localizations.dart'; // Import AppLocalizations
import '../widgets/language_toggle.dart';


class ForgotPasswordScreen extends StatefulWidget {
  final AuthService? authService;
  
  const ForgotPasswordScreen({this.authService, super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  late final AuthService _authService;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _authService = widget.authService ?? AuthService();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.forgotPasswordTitle),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppTheme.primaryGreen),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8.0),
            child: LanguageToggle(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                // 'Reset Password',
                AppLocalizations.of(context)!.resetPasswordHeading,
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryGreen,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                // 'Enter your email address and we will send you instructions to reset your password.',
                AppLocalizations.of(context)!.resetPasswordDescription,
                style: TextStyle(
                  fontSize: 16,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 32),
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
              const SizedBox(height: 24),
              Center(
                child: _isLoading
                  ? const CircularProgressIndicator()
                  : ElevatedButton(
                      onPressed: forgotPassword,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.buttonGrey,
                        padding: const EdgeInsets.symmetric(horizontal: 70, vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Text(
                        // 'Send Reset Link',
                        AppLocalizations.of(context)!.sendResetLink,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> forgotPassword() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      try {
        await _authService.requestPasswordResetCode(_emailController.text.trim());
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context)!.passwordResetSent),
              backgroundColor: AppTheme.primaryGreen,
            ),
          );
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => VerifyCodeScreen(
                email: _emailController.text.trim(),
                authService: _authService,
              ),
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              // Previously: content: Text(e.toString()),
              // Use localized generic error message with placeholder
              content: Text(AppLocalizations.of(context)!.genericError(e.toString())),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }
}
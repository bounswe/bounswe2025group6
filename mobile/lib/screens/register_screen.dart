import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:fithub/theme/app_theme.dart';
import '../l10n/app_localizations.dart';
import '../widgets/language_toggle.dart';
import '../services/auth_service.dart'; // Import AuthService
import 'login_screen.dart'; // Import LoginScreen

class RegisterPage extends StatefulWidget {
  final AuthService? authService; // Allow injecting AuthService for testing

  const RegisterPage({super.key, this.authService});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();

  String _username = '';
  String _email = '';
  String _password = '';
  String _userType = 'User'; // Default to 'User'
  PlatformFile? _pdfFile;
  bool _isLoading = false; // Loading state
  late final AuthService _authService; // Declare AuthService
  bool _acceptedTerms = false; // Add this near other state variables

  @override
  void initState() {
    super.initState();
    _authService =
        widget.authService ?? AuthService(); // Initialize AuthService
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    // Add this check before form submission
    if (!_acceptedTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.pleaseAcceptTerms),
        ),
      );
      return;
    }
    
    _formKey.currentState!.save();

    if (_userType == 'Dietitian' && _pdfFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.dietitianMustUploadPdf),
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      String apiUserType = _userType.toLowerCase();

      String? certificationUrl = null;
      // if (_pdfFile != null) {
      //   // This is a placeholder.
      //   // certificationUrl = "url_to_uploaded_pdf/${_pdfFile!.name}";
      // }

      await _authService.register(
        username: _username,
        email: _email,
        password: _password,
        usertype: apiUserType,
        certificationUrl: certificationUrl, // Pass null for now
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.registrationSuccessfulCheckEmail),
        ),
      );
      // Navigate to login page or a "check your email" page
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => const LoginScreen(),
          ), // Corrected to LoginScreen
        );
      }
    } on AuthenticationException catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.genericError(e.toString())),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _pickPdfFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() => _pdfFile = result.files.first);
    }
  }

  void _showTermsDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(AppLocalizations.of(context)!.termsAndConditions),
          content: SingleChildScrollView(
            child: Text(AppLocalizations.of(context)!.termsDialogContent),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(AppLocalizations.of(context)!.close),
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.primaryGreen,
              ),
            ),
          ],
        );
      },
    );
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return AppLocalizations.of(context)!.passwordRequired;
    }
    if (value.length < 8) {
      return AppLocalizations.of(context)!.passwordMinLength;
    }
    if (!value.contains(RegExp(r'[A-Z]'))) {
      return AppLocalizations.of(context)!.passwordMustContainUppercase;
    }
    if (!value.contains(RegExp(r'[a-z]'))) {
      return AppLocalizations.of(context)!.passwordMustContainLowercase;
    }
    if (!value.contains(RegExp(r'[0-9]'))) {
      return AppLocalizations.of(context)!.passwordMustContainNumber;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundGrey,
      appBar: AppBar(
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
        // title: const Text('Register'),
        title: Text(AppLocalizations.of(context)!.registerTitle),
        centerTitle: true,
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 8.0),
            child: LanguageToggle(),
          ),
        ],
      ),
      body: Center(
        child: Card(
          elevation: 8,
          margin: const EdgeInsets.all(20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    Text(
                      AppLocalizations.of(context)!.createAccountHeading,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      decoration: InputDecoration(
                        // labelText: 'Username',
                        labelText: AppLocalizations.of(context)!.usernameLabel,
                        border: const OutlineInputBorder(),
                      ),
                      onSaved: (v) => _username = v ?? '',
                      validator: (v) => v != null && v.length >= 3
                          ? null
                          : AppLocalizations.of(context)!.usernameEmptyError,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      decoration: InputDecoration(
                        labelText: AppLocalizations.of(context)!.emailLabel,
                        border: const OutlineInputBorder(),
                      ),
                      onSaved: (v) => _email = v ?? '',
                      validator: (v) => v != null && v.contains('@')
                          ? null
                          : AppLocalizations.of(context)!.invalidEmail,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      decoration: InputDecoration(
                        labelText: AppLocalizations.of(context)!.passwordLabel,
                        border: const OutlineInputBorder(),
                        helperText: AppLocalizations.of(context)!.passwordHelper,
                      ),
                      obscureText: true,
                      controller: _passwordController, // Assign controller
                      onSaved: (v) => _password = v ?? '',
                      validator: _validatePassword,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      // Added Confirm Password field
                      decoration: InputDecoration(
                        // labelText: 'Confirm Password',
                        labelText: AppLocalizations.of(context)!.confirmPasswordLabel,
                        border: const OutlineInputBorder(),
                      ),
                      obscureText: true,
                      validator: (v) {
                        if (v == null || v.isEmpty) {
                          return AppLocalizations.of(context)!.pleaseConfirmPassword;
                        }
                        if (v != _passwordController.text) {
                          return AppLocalizations.of(context)!.passwordsDoNotMatch;
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      decoration: InputDecoration(
                        labelText: AppLocalizations.of(context)!.userTypeLabel,
                        border: const OutlineInputBorder(),
                      ),
                      value: _userType,
                      items: [
                        DropdownMenuItem(value: 'User', child: Text(AppLocalizations.of(context)!.user)),
                        DropdownMenuItem(
                          value: 'Dietitian',
                          child: Text(AppLocalizations.of(context)!.dietitian),
                        ),
                      ],
                      onChanged: (v) {
                        setState(() {
                          _userType = v!;
                          _pdfFile = null;
                        });
                      },
                      onSaved: (v) => _userType = v ?? 'User',
                    ),
                    const SizedBox(height: 16),
                    if (_userType == 'Dietitian') ...[
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        onPressed: _pickPdfFile,
                        icon: const Icon(Icons.upload_file),
                        label: Text(AppLocalizations.of(context)!.uploadPdfButton),
                      ),
                      if (_pdfFile != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                              child: Text(
                                '${AppLocalizations.of(context)!.uploadedLabel}: ${_pdfFile!.name}',
                                style: const TextStyle(
                                  color: AppTheme.primaryGreen,
                                ),
                              ),
                        ),
                      const SizedBox(height: 16),
                    ],
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Checkbox(
                          value: _acceptedTerms,
                          onChanged: (value) {
                            setState(() {
                              _acceptedTerms = value ?? false;
                            });
                          },
                          activeColor: AppTheme.primaryGreen,
                        ),
                        Expanded(
                          child: Row(
                            children: [
                              Text(AppLocalizations.of(context)!.iAcceptThe),
                              GestureDetector(
                                onTap: _showTermsDialog,
                                child: Text(
                                  AppLocalizations.of(context)!.termsAndConditions,
                                  style: const TextStyle(
                                    color: AppTheme.primaryGreen,
                                    decoration: TextDecoration.underline,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: _isLoading ? null : _submitForm,
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2.0,
                                ),
                              )
                            : Text(
                                AppLocalizations.of(context)!.registerButton,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _passwordController.dispose(); // Dispose controller
    super.dispose();
  }
}

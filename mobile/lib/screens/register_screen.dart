import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:fithub/theme/app_theme.dart';
import '../services/auth_service.dart'; // Import AuthService
import 'login_screen.dart'; // Import LoginScreen

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

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
  final AuthService _authService = AuthService(); // AuthService instance

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    _formKey.currentState!.save();

    if (_userType == 'Dietitian' && _pdfFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Dietitians must upload a PDF certificate.'),
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
        const SnackBar(
          content: Text(
            'Registration successful! Please check your email to verify.',
          ),
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
          content: Text('An unexpected error occurred: ${e.toString()}'),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundGrey,
      appBar: AppBar(
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
        title: const Text('Register'),
        centerTitle: true,
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
                    const Text(
                      'Create Account',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'Username',
                        border: OutlineInputBorder(),
                      ),
                      onSaved: (v) => _username = v ?? '',
                      validator:
                          (v) =>
                              v != null && v.length >= 3
                                  ? null
                                  : 'Enter at least 3 characters',
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        border: OutlineInputBorder(),
                      ),
                      onSaved: (v) => _email = v ?? '',
                      validator:
                          (v) =>
                              v != null && v.contains('@')
                                  ? null
                                  : 'Enter a valid email',
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'Password',
                        border: OutlineInputBorder(),
                      ),
                      obscureText: true,
                      controller: _passwordController, // Assign controller
                      onSaved: (v) => _password = v ?? '',
                      validator:
                          (v) =>
                              v != null && v.length >= 6
                                  ? null
                                  : 'Enter at least 6 characters',
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      // Added Confirm Password field
                      decoration: const InputDecoration(
                        labelText: 'Confirm Password',
                        border: OutlineInputBorder(),
                      ),
                      obscureText: true,
                      validator: (v) {
                        if (v == null || v.isEmpty) {
                          return 'Please confirm your password';
                        }
                        if (v != _passwordController.text) {
                          return 'Passwords do not match';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(
                        labelText: 'User Type',
                        border: OutlineInputBorder(),
                      ),
                      value: _userType,
                      items: const [
                        DropdownMenuItem(value: 'User', child: Text('User')),
                        DropdownMenuItem(
                          value: 'Dietitian',
                          child: Text('Dietitian'),
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
                        label: const Text('Upload PDF (Certificate)'),
                      ),
                      if (_pdfFile != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            'Uploaded: ${_pdfFile!.name}',
                            style: const TextStyle(
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ),
                      const SizedBox(height: 16),
                    ],
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
                        onPressed:
                            _isLoading
                                ? null
                                : _submitForm, // Disable button when loading
                        child:
                            _isLoading
                                ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2.0,
                                  ),
                                )
                                : const Text(
                                  'Register',
                                  style: TextStyle(
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

  // End of _RegisterPageState class
}

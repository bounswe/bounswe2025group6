import 'package:flutter/material.dart';
import 'package:fithub/theme/app_theme.dart';
import 'package:fithub/services/auth_service.dart';

class CreateNewPasswordPage extends StatefulWidget {
  final String email;
  final AuthService? authService;

  const CreateNewPasswordPage({
    required this.email,
    this.authService,
    super.key,
  });

  @override
  State<CreateNewPasswordPage> createState() => _CreateNewPasswordPageState();
}

class _CreateNewPasswordPageState extends State<CreateNewPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _newPasswordController = TextEditingController();
  final _repeatPasswordController = TextEditingController();

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      final newPassword = _newPasswordController.text;
      debugPrint("New password: $newPassword");
      // TODO: Send password to backend
    }
  }

  @override
  void dispose() {
    _newPasswordController.dispose();
    _repeatPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundGrey,
      appBar: AppBar(
        title: const Text('Create New Password'),
        centerTitle: true,
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _newPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'New Password',
                  border: OutlineInputBorder(),
                ),
                validator: (value) =>
                value != null && value.length >= 6
                    ? null
                    : 'Enter at least 6 characters',
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _repeatPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Confirm Password',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value != _newPasswordController.text) {
                    return 'Passwords do not match';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _submitForm,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                ),
                child: const Text(
                  'Save Password',
                  style: TextStyle(fontSize: 16, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

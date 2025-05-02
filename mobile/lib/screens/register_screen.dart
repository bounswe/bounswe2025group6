import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();

  // --- Form alanları ---
  String _username = '';
  String _email    = '';
  String _password = '';
  String _userType = 'User';
  PlatformFile? _pdfFile;          // Dietitian için PDF

  // --- Formu gönder ---
  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();

      // Dietitian ise PDF zorunlu
      if (_userType == 'Dietitian' && _pdfFile == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lütfen PDF yükleyin')),
        );
        return;
      }

      // DEBUG çıktısı
      debugPrint('Username : $_username');
      debugPrint('Email    : $_email');
      debugPrint('Password : $_password');
      debugPrint('UserType : $_userType');
      if (_pdfFile != null) debugPrint('PDF      : ${_pdfFile!.name}');
    }
  }

  // --- PDF seç ---
  Future<void> _pickPdfFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() => _pdfFile = result.files.first);
    }
  }

  // --- UI -------------------------------------------------
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1FDF3),             // çok açık yeşil
      appBar: AppBar(
        backgroundColor: const Color(0xFF4CAF50),           // yeşil
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
                      'Hesap Oluştur',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Username
                    TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'Kullanıcı Adı',
                        border: OutlineInputBorder(),
                      ),
                      onSaved: (v) => _username = v ?? '',
                      validator: (v) => v != null && v.length >= 3
                          ? null
                          : 'En az 3 karakter',
                    ),
                    const SizedBox(height: 16),

                    // Email
                    TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        border: OutlineInputBorder(),
                      ),
                      onSaved: (v) => _email = v ?? '',
                      validator: (v) => v != null && v.contains('@')
                          ? null
                          : 'Geçerli email gir',
                    ),
                    const SizedBox(height: 16),

                    // Password
                    TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'Şifre',
                        border: OutlineInputBorder(),
                      ),
                      obscureText: true,
                      onSaved: (v) => _password = v ?? '',
                      validator: (v) => v != null && v.length >= 6
                          ? null
                          : 'En az 6 karakter',
                    ),
                    const SizedBox(height: 16),

                    // User Type
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(
                        labelText: 'Kullanıcı Tipi',
                        border: OutlineInputBorder(),
                      ),
                      value: _userType,
                      items: const [
                        DropdownMenuItem(
                          value: 'User',
                          child: Text('User'),
                        ),
                        DropdownMenuItem(
                          value: 'Dietitian',
                          child: Text('Dietitian'),
                        ),
                      ],
                      onChanged: (v) {
                        setState(() {
                          _userType = v!;
                          _pdfFile = null; // type değişince PDF sıfırla
                        });
                      },
                      onSaved: (v) => _userType = v ?? 'User',
                    ),
                    const SizedBox(height: 16),

                    // PDF picker (sadece Dietitian)
                    if (_userType == 'Dietitian') ...[
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF66BB6A),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        onPressed: _pickPdfFile,
                        icon: const Icon(Icons.upload_file),
                        label: const Text('PDF Yükle (Sertifika)'),
                      ),
                      if (_pdfFile != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            'Yüklenen: ${_pdfFile!.name}',
                            style: const TextStyle(color: Colors.green),
                          ),
                        ),
                      const SizedBox(height: 16),
                    ],

                    // Register Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF388E3C),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: _submitForm,
                        child: const Text(
                          'Kayıt Ol',
                          style: TextStyle(color: Colors.white, fontSize: 16),
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
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fithub/screens/new_password_screen.dart';   // ← şifre sayfan

class VerifyCodeScreen extends StatefulWidget {
  final String email;           // e‑postayı göstermek için (opsiyonel)

  const VerifyCodeScreen({super.key, required this.email});

  @override
  State<VerifyCodeScreen> createState() => _VerifyCodeScreenState();
}

class _VerifyCodeScreenState extends State<VerifyCodeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();

  // TODO: Gerçek doğrulama servisine bağla
  Future<bool> _validateCode(String code) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return code == '123456';                    // DEMO: 123456 doğru kabul
  }

  void _submit() async {
    if (_formKey.currentState!.validate()) {
      final ok = await _validateCode(_codeController.text);
      if (!ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Kod hatalı, tekrar deneyin')),
        );
        return;
      }
      // Kod doğru → yeni şifre sayfasına
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const CreateNewPasswordPage()),
      );
    }
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kodu Doğrula'),
        centerTitle: true,
        backgroundColor: Colors.green[700],
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Text(
                '${widget.email} adresine gönderilen 6 haneli kodu gir:',
                style: const TextStyle(fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              // 6 haneli kod
              TextFormField(
                controller: _codeController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(
                  labelText: 'Kod',
                  border: OutlineInputBorder(),
                  counterText: '',                // altındaki “0/6” yazısını gizler
                ),
                validator: (v) =>
                (v != null && v.length == 6) ? null : '6 haneli kod girin',
              ),

              const SizedBox(height: 32),

              // Doğrula butonu
              ElevatedButton(
                onPressed: _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green[700],
                  padding: const EdgeInsets.symmetric(
                      horizontal: 40, vertical: 12),
                ),
                child: const Text(
                  'Doğrula',
                  style: TextStyle(color: Colors.white, fontSize: 16),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

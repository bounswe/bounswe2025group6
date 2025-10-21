import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/locale_provider.dart';
import '../models/user_profile.dart';

/// Small language toggle used on unauthenticated screens.
/// Uses the app's [LocaleProvider] to switch the app locale at runtime.
class LanguageToggle extends StatelessWidget {
  const LanguageToggle({super.key});

  @override
  Widget build(BuildContext context) {
    final localeProvider = Provider.of<LocaleProvider>(context, listen: false);
    final currentCode = localeProvider.locale?.languageCode ?? 'en';
    final current = currentCode == 'tr' ? Language.tr : Language.en;

    final activeStyle = TextStyle(
      color: Theme.of(context).colorScheme.primary,
      fontWeight: FontWeight.bold,
    );
    final inactiveStyle = const TextStyle(color: Colors.grey);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        TextButton(
          onPressed: () => localeProvider.setLocaleFromLanguage(Language.en),
          child: Text('EN', style: current == Language.en ? activeStyle : inactiveStyle),
        ),
        const SizedBox(width: 4),
        TextButton(
          onPressed: () => localeProvider.setLocaleFromLanguage(Language.tr),
          child: Text('TR', style: current == Language.tr ? activeStyle : inactiveStyle),
        ),
      ],
    );
  }
}

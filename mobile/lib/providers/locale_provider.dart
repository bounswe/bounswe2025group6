import 'package:flutter/widgets.dart';
import '../models/user_profile.dart';

class LocaleProvider extends ChangeNotifier {
  Locale? _locale;

  Locale? get locale => _locale;

  void setLocaleFromLanguage(Language language) {
    switch (language) {
      case Language.en:
        _locale = const Locale('en');
        break;
      case Language.tr:
        _locale = const Locale('tr');
        break;
    }
    notifyListeners();
  }

  void clearLocale() {
    _locale = null;
    notifyListeners();
  }
}

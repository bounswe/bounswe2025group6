import 'package:flutter/widgets.dart';
import '../models/user_profile.dart';

class CurrencyProvider extends ChangeNotifier {
  Currency _currency = Currency.usd;

  Currency get currency => _currency;

  String get symbol {
    switch (_currency) {
      case Currency.usd:
        return '\$';
      case Currency.try_:
        return '₺';
    }
  }

  void setCurrency(Currency c) {
    _currency = c;
    notifyListeners();
  }

  void clear() {
    _currency = Currency.usd;
    notifyListeners();
  }
}

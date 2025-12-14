import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/locale_provider.dart';
import 'providers/currency_provider.dart';
import 'screens/login_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/meal_planner_screen.dart';
import 'screens/community/community_screen.dart';
import 'screens/community/create_post_screen.dart';
import 'screens/community/post_detail_screen.dart';
import 'screens/community/edit_post_screen.dart';
import 'screens/qa/qa_screen.dart';
import 'screens/qa/qa_detail_screen.dart';
import 'screens/qa/ask_question_screen.dart';
import 'theme/app_theme.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'l10n/app_localizations.dart';

import 'package:flutter/widgets.dart';
import 'services/profile_service.dart';

void main() async {
  // Ensure bindings for async work before runApp
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize LocaleProvider and CurrencyProvider with backend preference if the user is logged in.
  final localeProvider = LocaleProvider();
  final currencyProvider = CurrencyProvider();
  try {
    final profileService = ProfileService();
    final profile = await profileService.getUserProfile();
    // If we successfully fetched the profile, set the app locale and currency accordingly.
    localeProvider.setLocaleFromLanguage(profile.language);
    currencyProvider.setCurrency(profile.preferredCurrency);
  } catch (_) {
    // If not logged in or fetch failed, keep defaults so unauthenticated
    // screens can still allow manual switching.
  }

  runApp(MyApp(initialLocaleProvider: localeProvider, initialCurrencyProvider: currencyProvider));
}

class MyApp extends StatelessWidget {
  final LocaleProvider? initialLocaleProvider;
  final CurrencyProvider? initialCurrencyProvider;

  const MyApp({super.key, this.initialLocaleProvider, this.initialCurrencyProvider});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<LocaleProvider>(
          create: (_) => initialLocaleProvider ?? LocaleProvider(),
        ),
        ChangeNotifierProvider<CurrencyProvider>(
          create: (_) => initialCurrencyProvider ?? CurrencyProvider(),
        ),
      ],
      child: Consumer<LocaleProvider>(
        builder: (context, localeProvider, _) {
          return MaterialApp(
            title: 'FitHub',
            theme: AppTheme.lightTheme,
            locale: localeProvider.locale,
            home: const LoginScreen(),
            routes: {
              ProfileScreen.routeName: (context) => ProfileScreen(),
              '/meal-planner': (context) => const MealPlannerScreen(),
              '/community': (context) => const CommunityScreen(),
              '/community/create': (context) => const CreatePostScreen(),
              '/community/detail': (context) => const PostDetailScreen(),
              '/community/edit': (context) => EditPostScreen(
                post: ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>,
              ),
              '/qa': (context) => const QAScreen(),
              '/qa/create': (context) => const AskQuestionScreen(),
              '/qa/detail': (context) => const QADetailScreen(),
            },
            // Localization setup
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
          );
        },
      ),
    );
  }
}

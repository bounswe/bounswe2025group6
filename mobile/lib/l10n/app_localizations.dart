import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_tr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('tr'),
  ];

  /// The conventional newborn programmer greeting
  ///
  /// In en, this message translates to:
  /// **'Hello World!'**
  String get helloWorld;

  /// Application title displayed in the app bar
  ///
  /// In en, this message translates to:
  /// **'FitHub'**
  String get appTitle;

  /// Subtitle text on dashboard
  ///
  /// In en, this message translates to:
  /// **'Manage your meals, recipes, and plans here.'**
  String get dashboardSubtitle;

  /// Card title for discovering recipes
  ///
  /// In en, this message translates to:
  /// **'Discover Recipes'**
  String get discoverRecipes;

  /// Card title for uploading a recipe
  ///
  /// In en, this message translates to:
  /// **'Upload Recipe'**
  String get uploadRecipe;

  /// Card title to join community
  ///
  /// In en, this message translates to:
  /// **'Join Community'**
  String get joinCommunity;

  /// Card title for planning a meal
  ///
  /// In en, this message translates to:
  /// **'Plan a Meal'**
  String get planMeal;

  /// Logout label and dialog title
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// Logout confirmation dialog text
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to logout?'**
  String get logoutConfirmation;

  /// Cancel button text
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// Bottom navigation label for home
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// Label for community section / app bar
  ///
  /// In en, this message translates to:
  /// **'Community'**
  String get community;

  /// Bottom navigation label for profile
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// Greeting shown on dashboard
  ///
  /// In en, this message translates to:
  /// **'Welcome back!'**
  String get welcomeBack;

  /// Title for the discover recipes screen
  ///
  /// In en, this message translates to:
  /// **'Discover Recipes'**
  String get discoverRecipesTitle;

  /// Label for the search input
  ///
  /// In en, this message translates to:
  /// **'Search Recipes'**
  String get searchRecipes;

  /// Label for the max cost input
  ///
  /// In en, this message translates to:
  /// **'Max Cost (e.g., 50.0)'**
  String get maxCost;

  /// Label for dietary options section
  ///
  /// In en, this message translates to:
  /// **'Dietary Options:'**
  String get dietaryOptions;

  /// Label for sort by control
  ///
  /// In en, this message translates to:
  /// **'Sort By:'**
  String get sortBy;

  /// Dietary filter: high protein
  ///
  /// In en, this message translates to:
  /// **'High-Protein'**
  String get dietaryHighProtein;

  /// Dietary filter: low carbohydrate
  ///
  /// In en, this message translates to:
  /// **'Low-Carbohydrate'**
  String get dietaryLowCarbohydrate;

  /// Dietary filter: vegetarian
  ///
  /// In en, this message translates to:
  /// **'Vegetarian'**
  String get dietaryVegetarian;

  /// Dietary filter: vegan
  ///
  /// In en, this message translates to:
  /// **'Vegan'**
  String get dietaryVegan;

  /// Dietary filter: gluten free
  ///
  /// In en, this message translates to:
  /// **'Gluten-Free'**
  String get dietaryGlutenFree;

  /// Dietary filter: keto
  ///
  /// In en, this message translates to:
  /// **'Keto'**
  String get dietaryKeto;

  /// Dietary filter: paleo
  ///
  /// In en, this message translates to:
  /// **'Paleo'**
  String get dietaryPaleo;

  /// Dietary filter: pescatarian
  ///
  /// In en, this message translates to:
  /// **'Pescatarian'**
  String get dietaryPescatarian;

  /// Sort option label: name
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get sortName;

  /// Sort option label: cost
  ///
  /// In en, this message translates to:
  /// **'Cost'**
  String get sortCost;

  /// Sort option label: time
  ///
  /// In en, this message translates to:
  /// **'Time'**
  String get sortTime;

  /// Message shown when no recipes returned
  ///
  /// In en, this message translates to:
  /// **'No recipes found.'**
  String get noRecipesFound;

  /// Message when filters exclude all recipes
  ///
  /// In en, this message translates to:
  /// **'No recipes match your current filters.'**
  String get noRecipesMatchFilters;

  /// Fallback message when no recipes available
  ///
  /// In en, this message translates to:
  /// **'No recipes available.'**
  String get noRecipesAvailable;

  /// Error message when loading recipes fails
  ///
  /// In en, this message translates to:
  /// **'Error: {error}'**
  String errorLoadingRecipes(Object error);

  /// Shown in a snackbar when logout fails
  ///
  /// In en, this message translates to:
  /// **'Logout failed: {error}'**
  String logoutFailed(Object error);

  /// App bar title for forgot password screen
  ///
  /// In en, this message translates to:
  /// **'Forgot Password'**
  String get forgotPasswordTitle;

  /// Heading on forgot password screen
  ///
  /// In en, this message translates to:
  /// **'Reset Password'**
  String get resetPasswordHeading;

  /// Description on forgot password screen
  ///
  /// In en, this message translates to:
  /// **'Enter your email address and we will send you instructions to reset your password.'**
  String get resetPasswordDescription;

  /// Label for email input (kept consistent)
  ///
  /// In en, this message translates to:
  /// **'EMAIL'**
  String get emailLabel;

  /// Validation prompt when email empty
  ///
  /// In en, this message translates to:
  /// **'Please enter your email'**
  String get pleaseEnterEmail;

  /// Validation when email invalid
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get invalidEmail;

  /// Button text to send reset link
  ///
  /// In en, this message translates to:
  /// **'Send Reset Link'**
  String get sendResetLink;

  /// Success snackbar text after requesting reset
  ///
  /// In en, this message translates to:
  /// **'Password reset code has been sent to your email'**
  String get passwordResetSent;

  /// Login screen title
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get loginTitle;

  /// Login subtitle
  ///
  /// In en, this message translates to:
  /// **'Sign in to continue'**
  String get signInToContinue;

  /// Label for password field
  ///
  /// In en, this message translates to:
  /// **'PASSWORD'**
  String get passwordLabel;

  /// Validation for empty password
  ///
  /// In en, this message translates to:
  /// **'Please enter your password'**
  String get pleaseEnterPassword;

  /// Forgot password link text
  ///
  /// In en, this message translates to:
  /// **'Forgot Password?'**
  String get forgotPasswordQuestion;

  /// Login button text
  ///
  /// In en, this message translates to:
  /// **'Log In'**
  String get logInButton;

  /// Prompt when user has no account
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account? '**
  String get dontHaveAccount;

  /// Create account link text
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get createAccount;

  /// Snackbar text on successful login
  ///
  /// In en, this message translates to:
  /// **'Login successful!'**
  String get loginSuccessful;

  /// Snackbar text when login fails
  ///
  /// In en, this message translates to:
  /// **'Login failed: {message}'**
  String loginFailed(Object message);

  /// Shown when retrieval of JWT access/refresh tokens fails
  ///
  /// In en, this message translates to:
  /// **'Failed to obtain JWT tokens: {error}'**
  String failedToObtainJwtTokens(Object error);

  /// AppBar title for create new password screen
  ///
  /// In en, this message translates to:
  /// **'Create New Password'**
  String get createNewPasswordTitle;

  /// Label for new password field
  ///
  /// In en, this message translates to:
  /// **'New Password'**
  String get newPasswordLabel;

  /// Label for confirm password field
  ///
  /// In en, this message translates to:
  /// **'Confirm Password'**
  String get confirmPasswordLabel;

  /// Snackbar text when password reset succeeds
  ///
  /// In en, this message translates to:
  /// **'Password reset successful'**
  String get passwordResetSuccessful;

  /// Validation text when password empty
  ///
  /// In en, this message translates to:
  /// **'Password is required'**
  String get passwordRequired;

  /// Validation when password too short
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 8 characters'**
  String get passwordMinLength;

  /// Validation when passwords mismatch
  ///
  /// In en, this message translates to:
  /// **'Passwords do not match'**
  String get passwordsDoNotMatch;

  /// Save password button text
  ///
  /// In en, this message translates to:
  /// **'Save Password'**
  String get savePassword;

  /// Title when profile is not loaded
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profileTitle;

  /// Title when viewing own profile
  ///
  /// In en, this message translates to:
  /// **'My Profile'**
  String get myProfileTitle;

  /// Tooltip for profile settings button
  ///
  /// In en, this message translates to:
  /// **'Profile Settings'**
  String get profileSettingsTooltip;

  /// Retry button label
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// Error shown when profile fetch fails
  ///
  /// In en, this message translates to:
  /// **'Failed to load profile: {error}'**
  String failedToLoadProfile(Object error);

  /// Error shown when recipes fetch fails
  ///
  /// In en, this message translates to:
  /// **'Failed to load recipes: {error}'**
  String failedToLoadRecipes(Object error);

  /// Message when user id missing for recipes
  ///
  /// In en, this message translates to:
  /// **'User ID not available to load recipes.'**
  String get userIdNotAvailable;

  /// Shown when profile is null
  ///
  /// In en, this message translates to:
  /// **'Profile data is not available.'**
  String get profileDataNotAvailable;

  /// Message when user has no recipes
  ///
  /// In en, this message translates to:
  /// **'You haven\'t created any recipes yet.'**
  String get noUserRecipesYet;

  /// Section title
  ///
  /// In en, this message translates to:
  /// **'Personal Information'**
  String get personalInformation;

  /// Section title
  ///
  /// In en, this message translates to:
  /// **'Preferences'**
  String get preferences;

  /// Section title
  ///
  /// In en, this message translates to:
  /// **'Activity Stats'**
  String get activityStats;

  /// Section title
  ///
  /// In en, this message translates to:
  /// **'Localization & Accessibility'**
  String get localizationAccessibility;

  /// Section title
  ///
  /// In en, this message translates to:
  /// **'Community'**
  String get communitySection;

  /// Section title
  ///
  /// In en, this message translates to:
  /// **'My Recipes'**
  String get myRecipes;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'User Type'**
  String get userType;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Profile Status'**
  String get profileStatus;

  /// Public profile label
  ///
  /// In en, this message translates to:
  /// **'Public'**
  String get public;

  /// Private profile label
  ///
  /// In en, this message translates to:
  /// **'Private'**
  String get private;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Dietary Preferences'**
  String get dietaryPreferencesLabel;

  /// Label for allergens
  ///
  /// In en, this message translates to:
  /// **'Allergens:'**
  String get allergensLabel;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Disliked Foods'**
  String get dislikedFoodsLabel;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Monthly Budget'**
  String get monthlyBudgetLabel;

  /// Label for unset values
  ///
  /// In en, this message translates to:
  /// **'Not set'**
  String get notSet;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Recipes Created'**
  String get recipesCreated;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Average Recipe Rating'**
  String get avgRecipeRating;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Cooking Skill'**
  String get cookingSkill;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get languageLabel;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Date Format'**
  String get dateFormatLabel;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Currency'**
  String get currencyLabel;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Accessibility'**
  String get accessibilityLabel;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Nationality'**
  String get nationalityLabel;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Date of Birth'**
  String get dateOfBirthLabel;

  /// Label used before the user's joined date, e.g. 'Joined: 1/1/2020'
  ///
  /// In en, this message translates to:
  /// **'Joined'**
  String get joinedLabel;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Following'**
  String get followingLabel;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Bookmarked Recipes'**
  String get bookmarkedRecipesLabel;

  /// Info tile label
  ///
  /// In en, this message translates to:
  /// **'Liked Recipes'**
  String get likedRecipesLabel;

  /// Users suffix
  ///
  /// In en, this message translates to:
  /// **'users'**
  String get users;

  /// Recipes suffix
  ///
  /// In en, this message translates to:
  /// **'recipes'**
  String get recipes;

  /// Title for the profile settings app bar
  ///
  /// In en, this message translates to:
  /// **'Profile Settings'**
  String get profileSettingsTitle;

  /// Snackbar text when profile settings are saved
  ///
  /// In en, this message translates to:
  /// **'Settings saved!'**
  String get settingsSaved;

  /// Shown in a snackbar when saving settings fails
  ///
  /// In en, this message translates to:
  /// **'Failed to save settings: {error}'**
  String failedToSaveSettings(Object error);

  /// Label shown above avatar choices
  ///
  /// In en, this message translates to:
  /// **'Choose Your Avatar:'**
  String get chooseAvatar;

  /// Label for username input
  ///
  /// In en, this message translates to:
  /// **'Username'**
  String get usernameLabel;

  /// Validation when username is too short
  ///
  /// In en, this message translates to:
  /// **'Enter at least 3 characters'**
  String get usernameEmptyError;

  /// Hint text for disliked foods input
  ///
  /// In en, this message translates to:
  /// **'Disliked Foods (comma separated)'**
  String get dislikedFoodsHint;

  /// Hint for monthly budget input
  ///
  /// In en, this message translates to:
  /// **'Monthly Budget (\$) (Optional)'**
  String get monthlyBudgetHint;

  /// Label for public profile switch
  ///
  /// In en, this message translates to:
  /// **'Public Profile'**
  String get publicProfileLabel;

  /// Label for preferred currency field (kept for backward compatibility)
  ///
  /// In en, this message translates to:
  /// **'Preferred Currency'**
  String get preferredCurrencyLabel;

  /// Label for accessibility needs dropdown (kept for backward compatibility)
  ///
  /// In en, this message translates to:
  /// **'Accessibility Needs'**
  String get accessibilityNeedsLabel;

  /// Label for nationality field when optional
  ///
  /// In en, this message translates to:
  /// **'Nationality (Optional)'**
  String get nationalityOptional;

  /// Label for date of birth when optional
  ///
  /// In en, this message translates to:
  /// **'Date of Birth (Optional)'**
  String get dateOfBirthOptional;

  /// App bar title for recipe detail screen
  ///
  /// In en, this message translates to:
  /// **'Recipe Details'**
  String get recipeDetailsTitle;

  /// Section title for ingredients
  ///
  /// In en, this message translates to:
  /// **'Ingredients'**
  String get ingredientsTitle;

  /// Shown when a recipe has no ingredients
  ///
  /// In en, this message translates to:
  /// **'No ingredients listed.'**
  String get noIngredients;

  /// Section title for preparation steps
  ///
  /// In en, this message translates to:
  /// **'Preparation Steps'**
  String get preparationStepsTitle;

  /// Shown when a recipe has no preparation steps
  ///
  /// In en, this message translates to:
  /// **'No steps provided.'**
  String get noStepsProvided;

  /// Label for cost per serving
  ///
  /// In en, this message translates to:
  /// **'Cost per Serving:'**
  String get costPerServingLabel;

  /// Label for difficulty rating
  ///
  /// In en, this message translates to:
  /// **'Difficulty:'**
  String get difficultyLabel;

  /// Label for taste rating
  ///
  /// In en, this message translates to:
  /// **'Taste Rating:'**
  String get tasteRatingLabel;

  /// Label for health rating
  ///
  /// In en, this message translates to:
  /// **'Health Rating:'**
  String get healthRatingLabel;

  /// Label for likes
  ///
  /// In en, this message translates to:
  /// **'Likes:'**
  String get likesLabel;

  /// Label for comments
  ///
  /// In en, this message translates to:
  /// **'Comments:'**
  String get commentsLabel;

  /// Label for dietary info
  ///
  /// In en, this message translates to:
  /// **'Dietary Info:'**
  String get dietaryInfoLabel;

  /// Label shown under prep time icon
  ///
  /// In en, this message translates to:
  /// **'Prep Time'**
  String get prepTimeLabel;

  /// Label shown under cook time icon
  ///
  /// In en, this message translates to:
  /// **'Cook Time'**
  String get cookTimeLabel;

  /// Allergen label: peanuts
  ///
  /// In en, this message translates to:
  /// **'Peanuts'**
  String get allergenPeanuts;

  /// Allergen label: dairy
  ///
  /// In en, this message translates to:
  /// **'Dairy'**
  String get allergenDairy;

  /// Allergen label: soy
  ///
  /// In en, this message translates to:
  /// **'Soy'**
  String get allergenSoy;

  /// Allergen label: shellfish
  ///
  /// In en, this message translates to:
  /// **'Shellfish'**
  String get allergenShellfish;

  /// Allergen label: tree nuts
  ///
  /// In en, this message translates to:
  /// **'Tree Nuts'**
  String get allergenTreeNuts;

  /// Allergen label: wheat
  ///
  /// In en, this message translates to:
  /// **'Wheat'**
  String get allergenWheat;

  /// AppBar title for register screen
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get registerTitle;

  /// Heading on register screen
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get createAccountHeading;

  /// Helper text for password field
  ///
  /// In en, this message translates to:
  /// **'Must contain 8+ characters, uppercase, lowercase, and number'**
  String get passwordHelper;

  /// Validation for empty confirm password
  ///
  /// In en, this message translates to:
  /// **'Please confirm your password'**
  String get pleaseConfirmPassword;

  /// Label for user type dropdown
  ///
  /// In en, this message translates to:
  /// **'User Type'**
  String get userTypeLabel;

  /// Label for PDF upload button for dietitians
  ///
  /// In en, this message translates to:
  /// **'Upload PDF (Certificate)'**
  String get uploadPdfButton;

  /// Prefix shown before uploaded filename
  ///
  /// In en, this message translates to:
  /// **'Uploaded'**
  String get uploadedLabel;

  /// Text before terms link
  ///
  /// In en, this message translates to:
  /// **'I accept the '**
  String get iAcceptThe;

  /// Terms and conditions link text
  ///
  /// In en, this message translates to:
  /// **'Terms and Conditions'**
  String get termsAndConditions;

  /// Register button text
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get registerButton;

  /// App bar title for upload recipe screen
  ///
  /// In en, this message translates to:
  /// **'Upload New Recipe'**
  String get uploadRecipeTitle;

  /// Label for recipe name input
  ///
  /// In en, this message translates to:
  /// **'Recipe Name'**
  String get recipeNameLabel;

  /// Validation when recipe name empty
  ///
  /// In en, this message translates to:
  /// **'Please enter the recipe name'**
  String get enterRecipeNameValidation;

  /// Label for preparation time input
  ///
  /// In en, this message translates to:
  /// **'Preparation Time (minutes)'**
  String get preparationTimeLabel;

  /// Validation when preparation time empty
  ///
  /// In en, this message translates to:
  /// **'Please enter preparation time'**
  String get enterPreparationTime;

  /// Validation when a number is expected
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid number'**
  String get enterValidNumber;

  /// Validation when time must be positive
  ///
  /// In en, this message translates to:
  /// **'Time must be positive'**
  String get timeMustBePositive;

  /// Label for cooking time input
  ///
  /// In en, this message translates to:
  /// **'Cooking Time (minutes)'**
  String get cookingTimeLabel;

  /// Label for meal type shown in recipe card
  ///
  /// In en, this message translates to:
  /// **'Meal Type'**
  String get mealTypeLabel;

  /// Breakfast meal type
  ///
  /// In en, this message translates to:
  /// **'Breakfast'**
  String get breakfast;

  /// Lunch meal type
  ///
  /// In en, this message translates to:
  /// **'Lunch'**
  String get lunch;

  /// Dinner meal type
  ///
  /// In en, this message translates to:
  /// **'Dinner'**
  String get dinner;

  /// Validation when meal type not selected
  ///
  /// In en, this message translates to:
  /// **'Please select a meal type'**
  String get selectMealTypeValidation;

  /// Label for steps input
  ///
  /// In en, this message translates to:
  /// **'Steps'**
  String get stepsLabel;

  /// Hint text for steps input
  ///
  /// In en, this message translates to:
  /// **'Enter each step on a new line...'**
  String get stepsHint;

  /// Validation when steps empty
  ///
  /// In en, this message translates to:
  /// **'Please enter the steps'**
  String get enterStepsValidation;

  /// Label for ingredient name in ingredient field
  ///
  /// In en, this message translates to:
  /// **'Ingredient Name'**
  String get ingredientNameLabel;

  /// Validation when ingredient name empty
  ///
  /// In en, this message translates to:
  /// **'Enter ingredient name'**
  String get enterIngredientNameValidation;

  /// Shown when typeahead returns no ingredients
  ///
  /// In en, this message translates to:
  /// **'No ingredients found.'**
  String get noIngredientsFound;

  /// Label for quantity input
  ///
  /// In en, this message translates to:
  /// **'Quantity'**
  String get quantityLabel;

  /// Validation when quantity empty
  ///
  /// In en, this message translates to:
  /// **'Enter quantity'**
  String get enterQuantityValidation;

  /// Validation when quantity must be positive
  ///
  /// In en, this message translates to:
  /// **'Quantity must be positive'**
  String get quantityPositiveValidation;

  /// Label for unit input
  ///
  /// In en, this message translates to:
  /// **'Unit (e.g., pcs, cup)'**
  String get unitLabel;

  /// Label for remove ingredient button
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get removeLabel;

  /// Label for add ingredient button
  ///
  /// In en, this message translates to:
  /// **'Add Ingredient'**
  String get addIngredientLabel;

  /// Primary upload recipe button text
  ///
  /// In en, this message translates to:
  /// **'Upload Recipe'**
  String get uploadRecipeButton;

  /// Snackbar text on successful recipe upload
  ///
  /// In en, this message translates to:
  /// **'Recipe uploaded successfully!'**
  String get recipeUploadedSuccess;

  /// Snackbar text when upload fails
  ///
  /// In en, this message translates to:
  /// **'Failed to upload recipe.'**
  String get failedToUploadRecipe;

  /// Error when fetching ingredients
  ///
  /// In en, this message translates to:
  /// **'Failed to load ingredients: {error}'**
  String failedToLoadIngredients(Object error);

  /// Shown when recipe uploaded but profile count update failed
  ///
  /// In en, this message translates to:
  /// **'Recipe uploaded, but failed to update profile count: {error}'**
  String recipeUploadedButProfileCountFailed(Object error);

  /// Generic error message with placeholder for details
  ///
  /// In en, this message translates to:
  /// **'Error: {error}'**
  String genericError(Object error);

  /// User dropdown label
  ///
  /// In en, this message translates to:
  /// **'User'**
  String get user;

  /// Dietitian dropdown label
  ///
  /// In en, this message translates to:
  /// **'Dietitian'**
  String get dietitian;

  /// AppBar title for verify code screen
  ///
  /// In en, this message translates to:
  /// **'Verify Code'**
  String get verifyCodeTitle;

  /// Heading shown on verify code screen
  ///
  /// In en, this message translates to:
  /// **'Verify Reset Code'**
  String get verifyResetCodeHeading;

  /// Prompt showing which email the code was sent to
  ///
  /// In en, this message translates to:
  /// **'Enter the 6-digit code sent to {email}'**
  String enter6DigitCodeSentTo(Object email);

  /// Label for reset code input
  ///
  /// In en, this message translates to:
  /// **'Reset Code'**
  String get resetCodeLabel;

  /// Validation message when reset code empty
  ///
  /// In en, this message translates to:
  /// **'Please enter the reset code'**
  String get pleaseEnterResetCode;

  /// Validation when reset code length invalid
  ///
  /// In en, this message translates to:
  /// **'Reset code must be 6 digits'**
  String get resetCode6Digits;

  /// Primary button text to verify code
  ///
  /// In en, this message translates to:
  /// **'Verify Code'**
  String get verifyCodeButton;

  /// Snackbar text on successful code verification
  ///
  /// In en, this message translates to:
  /// **'Code verified successfully'**
  String get codeVerifiedSuccessfully;

  /// Snackbar text when vote removed
  ///
  /// In en, this message translates to:
  /// **'Vote removed successfully'**
  String get voteRemoved;

  /// Snackbar text prompting user to log in before voting
  ///
  /// In en, this message translates to:
  /// **'Please log in to vote.'**
  String get pleaseLogInToVote;

  /// Snackbar text when a comment is upvoted
  ///
  /// In en, this message translates to:
  /// **'Comment upvoted!'**
  String get commentUpvoted;

  /// Snackbar text when a comment is downvoted
  ///
  /// In en, this message translates to:
  /// **'Comment downvoted!'**
  String get commentDownvoted;

  /// Snackbar text when voting fails
  ///
  /// In en, this message translates to:
  /// **'Vote failed: {error}'**
  String voteFailed(Object error);

  /// Prefix showing the author of a comment
  ///
  /// In en, this message translates to:
  /// **'By {author}'**
  String byAuthor(Object author);

  /// Tooltip / accessibility label for delete comment button
  ///
  /// In en, this message translates to:
  /// **'Delete Comment'**
  String get deleteComment;

  /// Tooltip for upvote button
  ///
  /// In en, this message translates to:
  /// **'Upvote'**
  String get upvote;

  /// Tooltip for downvote button
  ///
  /// In en, this message translates to:
  /// **'Downvote'**
  String get downvote;

  /// Snackbar text when post upvoted
  ///
  /// In en, this message translates to:
  /// **'Post upvoted!'**
  String get postUpvoted;

  /// Snackbar text when post downvoted
  ///
  /// In en, this message translates to:
  /// **'Post downvoted!'**
  String get postDownvoted;

  /// Label for total time shown in recipe card
  ///
  /// In en, this message translates to:
  /// **'Total Time'**
  String get totalTimeLabel;

  /// Abbreviation for minutes
  ///
  /// In en, this message translates to:
  /// **'mins'**
  String get minutesAbbr;

  /// Section title for additional recipe information
  ///
  /// In en, this message translates to:
  /// **'Additional Information'**
  String get additionalInformationTitle;

  /// Shown when recipe detail cannot be found
  ///
  /// In en, this message translates to:
  /// **'Recipe not found.'**
  String get recipeNotFound;

  /// Short label for reporting actions
  ///
  /// In en, this message translates to:
  /// **'Report'**
  String get reportLabel;

  /// Report type: Spam
  ///
  /// In en, this message translates to:
  /// **'Spam'**
  String get reportTypeSpam;

  /// Description for report type Spam
  ///
  /// In en, this message translates to:
  /// **'Unsolicited or repetitive content'**
  String get reportTypeSpamDescription;

  /// Report type: Inappropriate
  ///
  /// In en, this message translates to:
  /// **'Inappropriate Content'**
  String get reportTypeInappropriate;

  /// Description for report type Inappropriate
  ///
  /// In en, this message translates to:
  /// **'Offensive or inappropriate material'**
  String get reportTypeInappropriateDescription;

  /// Report type: Harassment
  ///
  /// In en, this message translates to:
  /// **'Harassment'**
  String get reportTypeHarassment;

  /// Description for report type Harassment
  ///
  /// In en, this message translates to:
  /// **'Bullying or harassment'**
  String get reportTypeHarassmentDescription;

  /// Report type: Other
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get reportTypeOther;

  /// Description for report type Other
  ///
  /// In en, this message translates to:
  /// **'Other issues'**
  String get reportTypeOtherDescription;

  /// Snackbar text after successfully submitting a report
  ///
  /// In en, this message translates to:
  /// **'Report submitted successfully. Thank you for your feedback.'**
  String get reportSubmittedSuccess;

  /// Snackbar text when report submission fails
  ///
  /// In en, this message translates to:
  /// **'Failed to submit report: {error}'**
  String reportSubmitFailed(Object error);

  /// Fallback label for unnamed recipe
  ///
  /// In en, this message translates to:
  /// **'Recipe'**
  String get recipeFallback;

  /// Label asking user why they report content
  ///
  /// In en, this message translates to:
  /// **'Why are you reporting this?'**
  String get reportWhy;

  /// Label for additional details in report dialog
  ///
  /// In en, this message translates to:
  /// **'Additional details (optional)'**
  String get reportAdditionalDetails;

  /// Hint for the additional details field
  ///
  /// In en, this message translates to:
  /// **'Provide more information about this report...'**
  String get reportAdditionalDetailsHint;

  /// Button text to submit a report
  ///
  /// In en, this message translates to:
  /// **'Submit Report'**
  String get submitReport;

  /// Tooltip text for reporting an item
  ///
  /// In en, this message translates to:
  /// **'Report this content'**
  String get reportThisContent;

  /// Label for reporting a post in popup menu
  ///
  /// In en, this message translates to:
  /// **'Report Post'**
  String get reportPost;

  /// Fallback label for unnamed post
  ///
  /// In en, this message translates to:
  /// **'Post'**
  String get postFallback;

  /// Fallback author name when unknown
  ///
  /// In en, this message translates to:
  /// **'Unknown'**
  String get unknown;

  /// Title for delete post confirmation dialog
  ///
  /// In en, this message translates to:
  /// **'Delete Post'**
  String get deletePostTitle;

  /// Confirmation text for deleting a post
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete this post?'**
  String get deletePostConfirmation;

  /// Delete button label
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// Snackbar text when comment is added
  ///
  /// In en, this message translates to:
  /// **'Comment added!'**
  String get commentAdded;

  /// Snackbar text when comment is deleted
  ///
  /// In en, this message translates to:
  /// **'Comment deleted!'**
  String get commentDeleted;

  /// Generic error title for screens
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get errorTitle;

  /// Shown when a post detail cannot be found
  ///
  /// In en, this message translates to:
  /// **'Post not found'**
  String get postNotFound;

  /// Label for back button
  ///
  /// In en, this message translates to:
  /// **'Go Back'**
  String get goBack;

  /// AppBar title for post detail screen
  ///
  /// In en, this message translates to:
  /// **'Post Detail'**
  String get postDetailTitle;

  /// Label before created date
  ///
  /// In en, this message translates to:
  /// **'Created:'**
  String get createdLabel;

  /// Title for comments section
  ///
  /// In en, this message translates to:
  /// **'Comments'**
  String get commentsTitle;

  /// Hint text for add comment field
  ///
  /// In en, this message translates to:
  /// **'Add a comment...'**
  String get addCommentHint;

  /// Error shown when comments fail to load
  ///
  /// In en, this message translates to:
  /// **'Error loading comments:'**
  String get errorLoadingComments;

  /// Shown when there are no comments
  ///
  /// In en, this message translates to:
  /// **'No comments yet. Be the first!'**
  String get noCommentsYet;

  /// AppBar title for create post screen
  ///
  /// In en, this message translates to:
  /// **'Create Post'**
  String get createPostTitle;

  /// Primary button text to submit post
  ///
  /// In en, this message translates to:
  /// **'Post'**
  String get postButton;

  /// Label for post title input
  ///
  /// In en, this message translates to:
  /// **'Title*'**
  String get titleLabel;

  /// Helper text for title input
  ///
  /// In en, this message translates to:
  /// **'Maximum 255 characters'**
  String get titleHelper;

  /// Validation when title empty
  ///
  /// In en, this message translates to:
  /// **'Title is required'**
  String get titleRequired;

  /// Validation when title too long
  ///
  /// In en, this message translates to:
  /// **'Title must be less than 255 characters'**
  String get titleTooLong;

  /// Validation when title too short
  ///
  /// In en, this message translates to:
  /// **'Title must be at least 1 character'**
  String get titleTooShort;

  /// Label for post content input
  ///
  /// In en, this message translates to:
  /// **'Content*'**
  String get contentLabel;

  /// Helper text for content input
  ///
  /// In en, this message translates to:
  /// **'Maximum 1000 characters'**
  String get contentHelper;

  /// Validation when content empty
  ///
  /// In en, this message translates to:
  /// **'Content is required'**
  String get contentRequired;

  /// Validation when content too long
  ///
  /// In en, this message translates to:
  /// **'Content must be less than 1000 characters'**
  String get contentTooLong;

  /// Validation when content too short
  ///
  /// In en, this message translates to:
  /// **'Content must be at least 1 character'**
  String get contentTooShort;

  /// Label for allow comments switch
  ///
  /// In en, this message translates to:
  /// **'Allow Comments'**
  String get allowComments;

  /// Snackbar shown when a post is created
  ///
  /// In en, this message translates to:
  /// **'Post created successfully'**
  String get postCreatedSuccess;

  /// Label for tags section
  ///
  /// In en, this message translates to:
  /// **'Tags*'**
  String get tagsLabel;

  /// Label shown above selected tags
  ///
  /// In en, this message translates to:
  /// **'Selected Tags:'**
  String get selectedTagsLabel;

  /// Tag: Budget
  ///
  /// In en, this message translates to:
  /// **'Budget'**
  String get tagBudget;

  /// Tag: Meal Prep
  ///
  /// In en, this message translates to:
  /// **'Meal Prep'**
  String get tagMealPrep;

  /// Tag: Family
  ///
  /// In en, this message translates to:
  /// **'Family'**
  String get tagFamily;

  /// Tag: No Waste
  ///
  /// In en, this message translates to:
  /// **'No Waste'**
  String get tagNoWaste;

  /// Tag: Sustainability
  ///
  /// In en, this message translates to:
  /// **'Sustainability'**
  String get tagSustainability;

  /// Tag: Tips
  ///
  /// In en, this message translates to:
  /// **'Tips'**
  String get tagTips;

  /// Tag: Gluten Free
  ///
  /// In en, this message translates to:
  /// **'Gluten Free'**
  String get tagGlutenFree;

  /// Tag: Vegan
  ///
  /// In en, this message translates to:
  /// **'Vegan'**
  String get tagVegan;

  /// Tag: Vegetarian
  ///
  /// In en, this message translates to:
  /// **'Vegetarian'**
  String get tagVegetarian;

  /// Tag: Quick
  ///
  /// In en, this message translates to:
  /// **'Quick'**
  String get tagQuick;

  /// Tag: Healthy
  ///
  /// In en, this message translates to:
  /// **'Healthy'**
  String get tagHealthy;

  /// Tag: Student
  ///
  /// In en, this message translates to:
  /// **'Student'**
  String get tagStudent;

  /// Tag: Nutrition
  ///
  /// In en, this message translates to:
  /// **'Nutrition'**
  String get tagNutrition;

  /// Tag: Healthy Eating
  ///
  /// In en, this message translates to:
  /// **'Healthy Eating'**
  String get tagHealthyEating;

  /// Tag: Snacks
  ///
  /// In en, this message translates to:
  /// **'Snacks'**
  String get tagSnacks;

  /// Title for delete comment confirmation dialog
  ///
  /// In en, this message translates to:
  /// **'Delete Comment'**
  String get deleteCommentTitle;

  /// Confirmation text for deleting a comment
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete this comment?'**
  String get deleteCommentConfirmation;

  /// Cancel label for delete comment dialog
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get deleteCommentCancel;

  /// Delete label for delete comment dialog
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get deleteCommentDelete;

  /// Shown when creating a comment fails
  ///
  /// In en, this message translates to:
  /// **'Failed to add comment: {error}'**
  String failedToAddComment(Object error);

  /// Shown when deleting a comment fails
  ///
  /// In en, this message translates to:
  /// **'Failed to delete comment: {error}'**
  String failedToDeleteComment(Object error);

  /// AppBar title for edit post screen
  ///
  /// In en, this message translates to:
  /// **'Edit Post'**
  String get editPostTitle;

  /// Save button text for edit post
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get saveButton;

  /// Snackbar shown when user tries to register without accepting terms
  ///
  /// In en, this message translates to:
  /// **'Please accept the terms and conditions to continue.'**
  String get pleaseAcceptTerms;

  /// Validation shown when dietitian registration missing PDF
  ///
  /// In en, this message translates to:
  /// **'Dietitians must upload a PDF certificate.'**
  String get dietitianMustUploadPdf;

  /// Snackbar after successful registration
  ///
  /// In en, this message translates to:
  /// **'Registration successful! Please check your email to verify.'**
  String get registrationSuccessfulCheckEmail;

  /// Terms dialog full content
  ///
  /// In en, this message translates to:
  /// **'By using FitHub, you agree to the following terms:\n\n1. Your personal information will be handled according to our privacy policy.\n\n2. You are responsible for maintaining the confidentiality of your account.\n\n3. You agree to use the platform responsibly and not engage in any harmful activities.\n\n4. Dietitians must provide valid certification documents.\n\n5. We reserve the right to terminate accounts that violate our terms.'**
  String get termsDialogContent;

  /// Close button label for dialogs
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// Password validation message
  ///
  /// In en, this message translates to:
  /// **'Password must contain at least one uppercase letter'**
  String get passwordMustContainUppercase;

  /// Password validation message
  ///
  /// In en, this message translates to:
  /// **'Password must contain at least one lowercase letter'**
  String get passwordMustContainLowercase;

  /// Password validation message
  ///
  /// In en, this message translates to:
  /// **'Password must contain at least one number'**
  String get passwordMustContainNumber;

  /// Label for US Dollar currency
  ///
  /// In en, this message translates to:
  /// **'US Dollar (\$)'**
  String get currencyUsd;

  /// Label for Turkish Lira currency
  ///
  /// In en, this message translates to:
  /// **'Turkish Lira (₺)'**
  String get currencyTry;

  /// Date format label MM/DD/YYYY
  ///
  /// In en, this message translates to:
  /// **'MM/DD/YYYY'**
  String get dateFormatMmddyyyy;

  /// Date format label DD/MM/YYYY
  ///
  /// In en, this message translates to:
  /// **'DD/MM/YYYY'**
  String get dateFormatDdmmyyyy;

  /// Date format label YYYY-MM-DD
  ///
  /// In en, this message translates to:
  /// **'YYYY-MM-DD'**
  String get dateFormatYyyymmdd;

  /// Accessibility: none
  ///
  /// In en, this message translates to:
  /// **'None'**
  String get accessibilityNone;

  /// Accessibility: colorblind
  ///
  /// In en, this message translates to:
  /// **'Colorblind'**
  String get accessibilityColorblind;

  /// Accessibility: visual impairment
  ///
  /// In en, this message translates to:
  /// **'Visual Impairment'**
  String get accessibilityVisual;

  /// Accessibility: hearing impairment
  ///
  /// In en, this message translates to:
  /// **'Hearing Impairment'**
  String get accessibilityHearing;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'tr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'tr':
      return AppLocalizationsTr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}

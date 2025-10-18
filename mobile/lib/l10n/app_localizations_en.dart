// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get helloWorld => 'Hello World!';

  @override
  String get appTitle => 'FitHub';

  @override
  String get dashboardSubtitle => 'Manage your meals, recipes, and plans here.';

  @override
  String get discoverRecipes => 'Discover Recipes';

  @override
  String get uploadRecipe => 'Upload Recipe';

  @override
  String get joinCommunity => 'Join Community';

  @override
  String get planMeal => 'Plan a Meal';

  @override
  String get logout => 'Logout';

  @override
  String get logoutConfirmation => 'Are you sure you want to logout?';

  @override
  String get cancel => 'Cancel';

  @override
  String get home => 'Home';

  @override
  String get community => 'Community';

  @override
  String get profile => 'Profile';

  @override
  String get welcomeBack => 'Welcome back!';

  @override
  String get discoverRecipesTitle => 'Discover Recipes';

  @override
  String get searchRecipes => 'Search Recipes';

  @override
  String get maxCost => 'Max Cost (e.g., 50.0)';

  @override
  String get dietaryOptions => 'Dietary Options:';

  @override
  String get sortBy => 'Sort By:';

  @override
  String get dietaryHighProtein => 'High-Protein';

  @override
  String get dietaryLowCarbohydrate => 'Low-Carbohydrate';

  @override
  String get dietaryVegetarian => 'Vegetarian';

  @override
  String get dietaryVegan => 'Vegan';

  @override
  String get dietaryGlutenFree => 'Gluten-Free';

  @override
  String get dietaryKeto => 'Keto';

  @override
  String get dietaryPaleo => 'Paleo';

  @override
  String get dietaryPescatarian => 'Pescatarian';

  @override
  String get sortName => 'Name';

  @override
  String get sortCost => 'Cost';

  @override
  String get sortTime => 'Time';

  @override
  String get noRecipesFound => 'No recipes found.';

  @override
  String get noRecipesMatchFilters => 'No recipes match your current filters.';

  @override
  String get noRecipesAvailable => 'No recipes available.';

  @override
  String errorLoadingRecipes(Object error) {
    return 'Error: $error';
  }

  @override
  String logoutFailed(Object error) {
    return 'Logout failed: $error';
  }

  @override
  String get forgotPasswordTitle => 'Forgot Password';

  @override
  String get resetPasswordHeading => 'Reset Password';

  @override
  String get resetPasswordDescription =>
      'Enter your email address and we will send you instructions to reset your password.';

  @override
  String get emailLabel => 'EMAIL';

  @override
  String get pleaseEnterEmail => 'Please enter your email';

  @override
  String get invalidEmail => 'Enter a valid email';

  @override
  String get sendResetLink => 'Send Reset Link';

  @override
  String get passwordResetSent =>
      'Password reset code has been sent to your email';

  @override
  String get loginTitle => 'Login';

  @override
  String get signInToContinue => 'Sign in to continue';

  @override
  String get passwordLabel => 'PASSWORD';

  @override
  String get pleaseEnterPassword => 'Please enter your password';

  @override
  String get forgotPasswordQuestion => 'Forgot Password?';

  @override
  String get logInButton => 'Log In';

  @override
  String get dontHaveAccount => 'Don\'t have an account? ';

  @override
  String get createAccount => 'Create Account';

  @override
  String get loginSuccessful => 'Login successful!';

  @override
  String loginFailed(Object message) {
    return 'Login failed: $message';
  }

  @override
  String failedToObtainJwtTokens(Object error) {
    return 'Failed to obtain JWT tokens: $error';
  }

  @override
  String get createNewPasswordTitle => 'Create New Password';

  @override
  String get newPasswordLabel => 'New Password';

  @override
  String get confirmPasswordLabel => 'Confirm Password';

  @override
  String get passwordResetSuccessful => 'Password reset successful';

  @override
  String get passwordRequired => 'Password is required';

  @override
  String get passwordMinLength => 'Password must be at least 8 characters';

  @override
  String get passwordsDoNotMatch => 'Passwords do not match';

  @override
  String get savePassword => 'Save Password';

  @override
  String get profileTitle => 'Profile';

  @override
  String get myProfileTitle => 'My Profile';

  @override
  String get profileSettingsTooltip => 'Profile Settings';

  @override
  String get retry => 'Retry';

  @override
  String failedToLoadProfile(Object error) {
    return 'Failed to load profile: $error';
  }

  @override
  String failedToLoadRecipes(Object error) {
    return 'Failed to load recipes: $error';
  }

  @override
  String get userIdNotAvailable => 'User ID not available to load recipes.';

  @override
  String get profileDataNotAvailable => 'Profile data is not available.';

  @override
  String get noUserRecipesYet => 'You haven\'t created any recipes yet.';

  @override
  String get personalInformation => 'Personal Information';

  @override
  String get preferences => 'Preferences';

  @override
  String get activityStats => 'Activity Stats';

  @override
  String get localizationAccessibility => 'Localization & Accessibility';

  @override
  String get communitySection => 'Community';

  @override
  String get myRecipes => 'My Recipes';

  @override
  String get userType => 'User Type';

  @override
  String get profileStatus => 'Profile Status';

  @override
  String get public => 'Public';

  @override
  String get private => 'Private';

  @override
  String get dietaryPreferencesLabel => 'Dietary Preferences';

  @override
  String get allergensLabel => 'Allergens:';

  @override
  String get dislikedFoodsLabel => 'Disliked Foods';

  @override
  String get monthlyBudgetLabel => 'Monthly Budget';

  @override
  String get notSet => 'Not set';

  @override
  String get recipesCreated => 'Recipes Created';

  @override
  String get avgRecipeRating => 'Average Recipe Rating';

  @override
  String get cookingSkill => 'Cooking Skill';

  @override
  String get languageLabel => 'Language';

  @override
  String get dateFormatLabel => 'Date Format';

  @override
  String get currencyLabel => 'Currency';

  @override
  String get accessibilityLabel => 'Accessibility';

  @override
  String get nationalityLabel => 'Nationality';

  @override
  String get dateOfBirthLabel => 'Date of Birth';

  @override
  String get joinedLabel => 'Joined';

  @override
  String get followingLabel => 'Following';

  @override
  String get bookmarkedRecipesLabel => 'Bookmarked Recipes';

  @override
  String get likedRecipesLabel => 'Liked Recipes';

  @override
  String get users => 'users';

  @override
  String get recipes => 'recipes';

  @override
  String get profileSettingsTitle => 'Profile Settings';

  @override
  String get settingsSaved => 'Settings saved!';

  @override
  String failedToSaveSettings(Object error) {
    return 'Failed to save settings: $error';
  }

  @override
  String get chooseAvatar => 'Choose Your Avatar:';

  @override
  String get usernameLabel => 'Username';

  @override
  String get usernameEmptyError => 'Enter at least 3 characters';

  @override
  String get dislikedFoodsHint => 'Disliked Foods (comma separated)';

  @override
  String get monthlyBudgetHint => 'Monthly Budget (Optional)';

  @override
  String get publicProfileLabel => 'Public Profile';

  @override
  String get preferredCurrencyLabel => 'Preferred Currency';

  @override
  String get accessibilityNeedsLabel => 'Accessibility Needs';

  @override
  String get nationalityOptional => 'Nationality (Optional)';

  @override
  String get dateOfBirthOptional => 'Date of Birth (Optional)';

  @override
  String get recipeDetailsTitle => 'Recipe Details';

  @override
  String get ingredientsTitle => 'Ingredients';

  @override
  String get noIngredients => 'No ingredients listed.';

  @override
  String get preparationStepsTitle => 'Preparation Steps';

  @override
  String get noStepsProvided => 'No steps provided.';

  @override
  String get costPerServingLabel => 'Cost per Serving:';

  @override
  String get difficultyLabel => 'Difficulty:';

  @override
  String get tasteRatingLabel => 'Taste Rating:';

  @override
  String get healthRatingLabel => 'Health Rating:';

  @override
  String get likesLabel => 'Likes:';

  @override
  String get commentsLabel => 'Comments:';

  @override
  String get dietaryInfoLabel => 'Dietary Info:';

  @override
  String get prepTimeLabel => 'Prep Time';

  @override
  String get cookTimeLabel => 'Cook Time';

  @override
  String get allergenPeanuts => 'Peanuts';

  @override
  String get allergenDairy => 'Dairy';

  @override
  String get allergenSoy => 'Soy';

  @override
  String get allergenShellfish => 'Shellfish';

  @override
  String get allergenTreeNuts => 'Tree Nuts';

  @override
  String get allergenWheat => 'Wheat';

  @override
  String get registerTitle => 'Register';

  @override
  String get createAccountHeading => 'Create Account';

  @override
  String get passwordHelper =>
      'Must contain 8+ characters, uppercase, lowercase, and number';

  @override
  String get pleaseConfirmPassword => 'Please confirm your password';

  @override
  String get userTypeLabel => 'User Type';

  @override
  String get uploadPdfButton => 'Upload PDF (Certificate)';

  @override
  String get uploadedLabel => 'Uploaded';

  @override
  String get iAcceptThe => 'I accept the ';

  @override
  String get termsAndConditions => 'Terms and Conditions';

  @override
  String get registerButton => 'Register';

  @override
  String get uploadRecipeTitle => 'Upload New Recipe';

  @override
  String get recipeNameLabel => 'Recipe Name';

  @override
  String get enterRecipeNameValidation => 'Please enter the recipe name';

  @override
  String get preparationTimeLabel => 'Preparation Time (minutes)';

  @override
  String get enterPreparationTime => 'Please enter preparation time';

  @override
  String get enterValidNumber => 'Please enter a valid number';

  @override
  String get timeMustBePositive => 'Time must be positive';

  @override
  String get cookingTimeLabel => 'Cooking Time (minutes)';

  @override
  String get mealTypeLabel => 'Meal Type';

  @override
  String get breakfast => 'Breakfast';

  @override
  String get lunch => 'Lunch';

  @override
  String get dinner => 'Dinner';

  @override
  String get selectMealTypeValidation => 'Please select a meal type';

  @override
  String get stepsLabel => 'Steps';

  @override
  String get stepsHint => 'Enter each step on a new line...';

  @override
  String get enterStepsValidation => 'Please enter the steps';

  @override
  String get ingredientNameLabel => 'Ingredient Name';

  @override
  String get enterIngredientNameValidation => 'Enter ingredient name';

  @override
  String get noIngredientsFound => 'No ingredients found.';

  @override
  String get quantityLabel => 'Quantity';

  @override
  String get enterQuantityValidation => 'Enter quantity';

  @override
  String get quantityPositiveValidation => 'Quantity must be positive';

  @override
  String get unitLabel => 'Unit (e.g., pcs, cup)';

  @override
  String get removeLabel => 'Remove';

  @override
  String get addIngredientLabel => 'Add Ingredient';

  @override
  String get uploadRecipeButton => 'Upload Recipe';

  @override
  String get recipeUploadedSuccess => 'Recipe uploaded successfully!';

  @override
  String get failedToUploadRecipe => 'Failed to upload recipe.';

  @override
  String failedToLoadIngredients(Object error) {
    return 'Failed to load ingredients: $error';
  }

  @override
  String recipeUploadedButProfileCountFailed(Object error) {
    return 'Recipe uploaded, but failed to update profile count: $error';
  }

  @override
  String genericError(Object error) {
    return 'Error: $error';
  }

  @override
  String get user => 'User';

  @override
  String get dietitian => 'Dietitian';

  @override
  String get verifyCodeTitle => 'Verify Code';

  @override
  String get verifyResetCodeHeading => 'Verify Reset Code';

  @override
  String enter6DigitCodeSentTo(Object email) {
    return 'Enter the 6-digit code sent to $email';
  }

  @override
  String get resetCodeLabel => 'Reset Code';

  @override
  String get pleaseEnterResetCode => 'Please enter the reset code';

  @override
  String get resetCode6Digits => 'Reset code must be 6 digits';

  @override
  String get verifyCodeButton => 'Verify Code';

  @override
  String get codeVerifiedSuccessfully => 'Code verified successfully';

  @override
  String get voteRemoved => 'Vote removed successfully';

  @override
  String get pleaseLogInToVote => 'Please log in to vote.';

  @override
  String get commentUpvoted => 'Comment upvoted!';

  @override
  String get commentDownvoted => 'Comment downvoted!';

  @override
  String voteFailed(Object error) {
    return 'Vote failed: $error';
  }

  @override
  String byAuthor(Object author) {
    return 'By $author';
  }

  @override
  String get deleteComment => 'Delete Comment';

  @override
  String get upvote => 'Upvote';

  @override
  String get downvote => 'Downvote';

  @override
  String get postUpvoted => 'Post upvoted!';

  @override
  String get postDownvoted => 'Post downvoted!';

  @override
  String get totalTimeLabel => 'Total Time';

  @override
  String get minutesAbbr => 'mins';

  @override
  String get additionalInformationTitle => 'Additional Information';

  @override
  String get recipeNotFound => 'Recipe not found.';

  @override
  String get reportLabel => 'Report';

  @override
  String get reportTypeSpam => 'Spam';

  @override
  String get reportTypeSpamDescription => 'Unsolicited or repetitive content';

  @override
  String get reportTypeInappropriate => 'Inappropriate Content';

  @override
  String get reportTypeInappropriateDescription =>
      'Offensive or inappropriate material';

  @override
  String get reportTypeHarassment => 'Harassment';

  @override
  String get reportTypeHarassmentDescription => 'Bullying or harassment';

  @override
  String get reportTypeOther => 'Other';

  @override
  String get reportTypeOtherDescription => 'Other issues';

  @override
  String get reportSubmittedSuccess =>
      'Report submitted successfully. Thank you for your feedback.';

  @override
  String reportSubmitFailed(Object error) {
    return 'Failed to submit report: $error';
  }

  @override
  String get recipeFallback => 'Recipe';

  @override
  String get reportWhy => 'Why are you reporting this?';

  @override
  String get reportAdditionalDetails => 'Additional details (optional)';

  @override
  String get reportAdditionalDetailsHint =>
      'Provide more information about this report...';

  @override
  String get submitReport => 'Submit Report';

  @override
  String get reportThisContent => 'Report this content';

  @override
  String get reportPost => 'Report Post';

  @override
  String get postFallback => 'Post';

  @override
  String get unknown => 'Unknown';

  @override
  String get deletePostTitle => 'Delete Post';

  @override
  String get deletePostConfirmation =>
      'Are you sure you want to delete this post?';

  @override
  String get delete => 'Delete';

  @override
  String get commentAdded => 'Comment added!';

  @override
  String get commentDeleted => 'Comment deleted!';

  @override
  String get errorTitle => 'Error';

  @override
  String get postNotFound => 'Post not found';

  @override
  String get goBack => 'Go Back';

  @override
  String get postDetailTitle => 'Post Detail';

  @override
  String get createdLabel => 'Created:';

  @override
  String get commentsTitle => 'Comments';

  @override
  String get addCommentHint => 'Add a comment...';

  @override
  String get errorLoadingComments => 'Error loading comments:';

  @override
  String get noCommentsYet => 'No comments yet. Be the first!';

  @override
  String get createPostTitle => 'Create Post';

  @override
  String get postButton => 'Post';

  @override
  String get titleLabel => 'Title*';

  @override
  String get titleHelper => 'Maximum 255 characters';

  @override
  String get titleRequired => 'Title is required';

  @override
  String get titleTooLong => 'Title must be less than 255 characters';

  @override
  String get titleTooShort => 'Title must be at least 1 character';

  @override
  String get contentLabel => 'Content*';

  @override
  String get contentHelper => 'Maximum 1000 characters';

  @override
  String get contentRequired => 'Content is required';

  @override
  String get contentTooLong => 'Content must be less than 1000 characters';

  @override
  String get contentTooShort => 'Content must be at least 1 character';

  @override
  String get allowComments => 'Allow Comments';

  @override
  String get postCreatedSuccess => 'Post created successfully';

  @override
  String get tagsLabel => 'Tags*';

  @override
  String get selectedTagsLabel => 'Selected Tags:';

  @override
  String get tagBudget => 'Budget';

  @override
  String get tagMealPrep => 'Meal Prep';

  @override
  String get tagFamily => 'Family';

  @override
  String get tagNoWaste => 'No Waste';

  @override
  String get tagSustainability => 'Sustainability';

  @override
  String get tagTips => 'Tips';

  @override
  String get tagGlutenFree => 'Gluten Free';

  @override
  String get tagVegan => 'Vegan';

  @override
  String get tagVegetarian => 'Vegetarian';

  @override
  String get tagQuick => 'Quick';

  @override
  String get tagHealthy => 'Healthy';

  @override
  String get tagStudent => 'Student';

  @override
  String get tagNutrition => 'Nutrition';

  @override
  String get tagHealthyEating => 'Healthy Eating';

  @override
  String get tagSnacks => 'Snacks';

  @override
  String get deleteCommentTitle => 'Delete Comment';

  @override
  String get deleteCommentConfirmation =>
      'Are you sure you want to delete this comment?';

  @override
  String get deleteCommentCancel => 'Cancel';

  @override
  String get deleteCommentDelete => 'Delete';

  @override
  String failedToAddComment(Object error) {
    return 'Failed to add comment: $error';
  }

  @override
  String failedToDeleteComment(Object error) {
    return 'Failed to delete comment: $error';
  }

  @override
  String get editPostTitle => 'Edit Post';

  @override
  String get saveButton => 'Save';

  @override
  String get pleaseAcceptTerms =>
      'Please accept the terms and conditions to continue.';

  @override
  String get dietitianMustUploadPdf =>
      'Dietitians must upload a PDF certificate.';

  @override
  String get registrationSuccessfulCheckEmail =>
      'Registration successful! Please check your email to verify.';

  @override
  String get termsDialogContent =>
      'By using FitHub, you agree to the following terms:\n\n1. Your personal information will be handled according to our privacy policy.\n\n2. You are responsible for maintaining the confidentiality of your account.\n\n3. You agree to use the platform responsibly and not engage in any harmful activities.\n\n4. Dietitians must provide valid certification documents.\n\n5. We reserve the right to terminate accounts that violate our terms.';

  @override
  String get close => 'Close';

  @override
  String get passwordMustContainUppercase =>
      'Password must contain at least one uppercase letter';

  @override
  String get passwordMustContainLowercase =>
      'Password must contain at least one lowercase letter';

  @override
  String get passwordMustContainNumber =>
      'Password must contain at least one number';

  @override
  String get currencyUsd => 'US Dollar (\$)';

  @override
  String get currencyTry => 'Turkish Lira (₺)';

  @override
  String get dateFormatMmddyyyy => 'MM/DD/YYYY';

  @override
  String get dateFormatDdmmyyyy => 'DD/MM/YYYY';

  @override
  String get dateFormatYyyymmdd => 'YYYY-MM-DD';

  @override
  String get accessibilityNone => 'None';

  @override
  String get accessibilityColorblind => 'Colorblind';

  @override
  String get accessibilityVisual => 'Visual Impairment';

  @override
  String get accessibilityHearing => 'Hearing Impairment';
}

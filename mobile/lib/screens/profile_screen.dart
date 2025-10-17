import 'package:flutter/material.dart';
import '../models/user_profile.dart';
import '../models/recipe.dart'; 
import '../services/profile_service.dart';
import '../services/recipe_service.dart'; 
import '../theme/app_theme.dart';
import '../widgets/recipe_card.dart'; 
import './profile_settings_screen.dart';
import '../l10n/app_localizations.dart'; // Import AppLocalizations

class ProfileScreen extends StatefulWidget {
  static const String routeName = '/profile';
  final ProfileService profileService;

  ProfileScreen({
    Key? key,
    ProfileService? profileService, // Allow nullable for default instantiation
  }) : profileService =
           profileService ?? ProfileService(), // Use provided or default
       super(key: key);

  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final ProfileService
  _profileService; // Will be set from widget.profileService
  late final RecipeService _recipeService; // Added RecipeService instance
  UserProfile? _userProfile;
  bool _isLoading = true;
  String? _errorMessage;

  List<Recipe> _userRecipes = [];
  bool _isLoadingRecipes = true;
  String? _recipesErrorMessage;

  @override
  void initState() {
    super.initState();
    _profileService = widget.profileService; // Initialize from the widget
    _recipeService = RecipeService(); // Initialize RecipeService
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final profile = await _profileService.getUserProfile();
      if (!mounted) return;
      setState(() {
        _userProfile = profile;
        _isLoading = false;
      });
      if (_userProfile != null) {
        _loadAndFilterUserRecipes(); // Load recipes after profile is loaded
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        // _errorMessage = 'Failed to load profile: $e';
        _errorMessage = AppLocalizations.of(context)!.failedToLoadProfile(e.toString());
      });
    }
  }

  Future<void> _loadAndFilterUserRecipes() async {
    if (_userProfile?.id == null) {
      if (mounted) {
        setState(() {
          _isLoadingRecipes = false;
          // _recipesErrorMessage = 'User ID not available to load recipes.';
          _recipesErrorMessage = AppLocalizations.of(context)!.userIdNotAvailable;
        });
      }
      return;
    }

    if (!mounted) return;
    setState(() {
      _isLoadingRecipes = true;
      _recipesErrorMessage = null;
    });

    try {
      // Fetch all recipes - consider pagination implications for large datasets
      final allRecipes = await _recipeService.getAllRecipes(
        pageSize: 100,
      ); // Fetching up to 100 recipes
      if (!mounted) return;

      final filteredRecipes =
          allRecipes
              .where((recipe) => recipe.creatorId == _userProfile!.id)
              .toList();

      setState(() {
        _userRecipes = filteredRecipes;
        _isLoadingRecipes = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingRecipes = false;
        // _recipesErrorMessage = 'Failed to load recipes: $e';
        _recipesErrorMessage = AppLocalizations.of(context)!.failedToLoadRecipes(e.toString());
      });
    }
  }

  ImageProvider? _getProfileImageProvider() {
    if (_userProfile?.profilePictureUrl != null &&
        _userProfile!.profilePictureUrl!.isNotEmpty) {
      if (_userProfile!.profilePictureUrl!.startsWith('assets/')) {
        return AssetImage(_userProfile!.profilePictureUrl!);
      } else {
        return NetworkImage(_userProfile!.profilePictureUrl!);
      }
    }
    return null; // No image if URL is null or empty
  }

  void _navigateToSettings() async {
    if (_userProfile == null) return;

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder:
            (context) => ProfileSettingsScreen(
              userProfile: _userProfile!,
              profileService: _profileService, // Pass the instance
            ),
      ),
    );

    // Handle result from ProfileSettingsScreen
    if (result is UserProfile && mounted) {
      // If the full profile was returned (e.g., after a save)
      setState(() {
        _userProfile = result;
      });
    } else if (result == true && mounted) {
      _loadUserProfile();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundGrey,
      appBar: AppBar(
        title: Text(
          _userProfile == null && !_isLoading
              ? AppLocalizations.of(context)!.profileTitle
              : AppLocalizations.of(context)!.myProfileTitle,
          style: TextStyle(
            color: AppTheme.primaryGreen,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 2,
        iconTheme: IconThemeData(color: AppTheme.primaryGreen),
        actions: _userProfile != null
            ? [
                IconButton(
                  icon: Icon(Icons.settings),
                  color: AppTheme.primaryGreen,
                  onPressed: _navigateToSettings,
                  // tooltip: 'Profile Settings',
                  tooltip: AppLocalizations.of(context)!.profileSettingsTooltip,
                ),
              ]
            : null,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryGreen),
        ),
      );
    }

      if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_errorMessage!, textAlign: TextAlign.center),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: _loadUserProfile,
                child: Text(AppLocalizations.of(context)!.retry),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_userProfile == null) {
      return Center(child: Text(AppLocalizations.of(context)!.profileDataNotAvailable));
    }
    return _buildProfileDisplay();
  }

  Widget _buildProfileDisplay() {
    final profile = _userProfile!;

    return ListView(
      padding: EdgeInsets.all(20.0),
      children: <Widget>[
        Center(
          child: CircleAvatar(
            radius: 60,
            backgroundImage: _getProfileImageProvider(),
            backgroundColor: Colors.grey.shade300,
            child:
                _getProfileImageProvider() == null
                    ? Icon(Icons.person, size: 60, color: Colors.grey.shade700)
                    : null,
          ),
        ),
        SizedBox(height: 20),
        Center(
          child: Text(
            profile.username,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryGreen,
            ),
          ),
        ),
        Center(
          child: Text(
            profile.email,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: Colors.grey.shade700),
          ),
        ),
        SizedBox(height: 10),
        Center(
          child: Text(
            '${AppLocalizations.of(context)!.joinedLabel}: ${MaterialLocalizations.of(context).formatShortDate(profile.joinedDate)}',
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
          ),
        ),
        SizedBox(height: 30),
        _buildSectionTitle(context, AppLocalizations.of(context)!.personalInformation),
        _buildInfoCard([
          _buildInfoTile(Icons.person_outline, AppLocalizations.of(context)!.userType, profile.userType),
          _buildInfoTile(
            Icons.public_outlined,
            AppLocalizations.of(context)!.profileStatus,
            profile.publicProfile ? AppLocalizations.of(context)!.public : AppLocalizations.of(context)!.private,
          ),
        ]),
        SizedBox(height: 20),
        _buildSectionTitle(context, AppLocalizations.of(context)!.preferences),
        _buildInfoCard([
          _buildInfoTile(
            Icons.restaurant_menu_outlined,
            AppLocalizations.of(context)!.dietaryPreferencesLabel,
            profile.dietaryPreferences.join(', ').isNotEmpty
                ? profile.dietaryPreferences.join(', ')
                : AppLocalizations.of(context)!.notSet,
          ),
          _buildInfoTile(
            Icons.warning_amber_outlined,
            AppLocalizations.of(context)!.allergensLabel,
            profile.allergens.join(', ').isNotEmpty
                ? profile.allergens.join(', ')
                : AppLocalizations.of(context)!.notSet,
          ),
          _buildInfoTile(
            Icons.no_food_outlined,
            AppLocalizations.of(context)!.dislikedFoodsLabel,
            profile.dislikedFoods.isNotEmpty
                ? profile.dislikedFoods
                : AppLocalizations.of(context)!.notSet,
          ),
          _buildInfoTile(
            Icons.attach_money_outlined,
            AppLocalizations.of(context)!.monthlyBudgetLabel,
            profile.monthlyBudget != null
                ? '\$${profile.monthlyBudget!.toStringAsFixed(2)}'
                : AppLocalizations.of(context)!.notSet,
          ),
        ]),
        SizedBox(height: 20),
        _buildSectionTitle(context, AppLocalizations.of(context)!.activityStats),
        _buildInfoCard([
          _buildInfoTile(
            Icons.receipt_long_outlined, // Changed icon
            AppLocalizations.of(context)!.recipesCreated,
            profile.recipeCount?.toString() ?? AppLocalizations.of(context)!.notSet,
          ),
          _buildInfoTile(
            Icons.star_border_outlined, // Changed icon
            AppLocalizations.of(context)!.avgRecipeRating,
            profile.avgRecipeRating != null
                ? '${profile.avgRecipeRating!.toStringAsFixed(1)} ★'
                : AppLocalizations.of(context)!.notSet,
          ),
          _buildInfoTile(
            Icons.soup_kitchen_outlined, // Changed icon
            AppLocalizations.of(context)!.cookingSkill,
            profile.typeOfCook ?? AppLocalizations.of(context)!.notSet,
          ),
        ]),
        SizedBox(height: 20),
        _buildSectionTitle(context, AppLocalizations.of(context)!.localizationAccessibility),
        _buildInfoCard([
          _buildInfoTile(
            Icons.language,
            AppLocalizations.of(context)!.languageLabel,
            profile.language.displayName,
          ),
          _buildInfoTile(
            Icons.calendar_today,
            AppLocalizations.of(context)!.dateFormatLabel,
            profile.preferredDateFormat.displayName,
          ),
          _buildInfoTile(
            Icons.attach_money,
            AppLocalizations.of(context)!.currencyLabel,
            profile.preferredCurrency.displayName,
          ),
          _buildInfoTile(
            Icons.accessibility_new,
            AppLocalizations.of(context)!.accessibilityLabel,
            profile.accessibilityNeeds.displayName,
          ),
          if (profile.nationality != null)
            _buildInfoTile(
              Icons.flag,
              AppLocalizations.of(context)!.nationalityLabel,
              profile.nationality!,
            ),
          if (profile.dateOfBirth != null)
            _buildInfoTile(
              Icons.cake,
              AppLocalizations.of(context)!.dateOfBirthLabel,
              '${profile.dateOfBirth!.day}/${profile.dateOfBirth!.month}/${profile.dateOfBirth!.year}',
            ),
        ]),
        SizedBox(height: 20),
        _buildSectionTitle(context, AppLocalizations.of(context)!.communitySection),
        _buildInfoCard([
          _buildInfoTile(
            Icons.people_outline,
            AppLocalizations.of(context)!.followingLabel,
            profile.followedUsers != null
                ? '${profile.followedUsers!.length} ${AppLocalizations.of(context)!.users}'
                : '0 ${AppLocalizations.of(context)!.users}',
          ),
          _buildInfoTile(
            Icons.bookmark_border_outlined,
            AppLocalizations.of(context)!.bookmarkedRecipesLabel,
            profile.bookmarkRecipes != null
                ? '${profile.bookmarkRecipes!.length} ${AppLocalizations.of(context)!.recipes}'
                : '0 ${AppLocalizations.of(context)!.recipes}',
          ),
          _buildInfoTile(
            Icons.favorite_border_outlined,
            AppLocalizations.of(context)!.likedRecipesLabel,
            profile.likedRecipes != null
                ? '${profile.likedRecipes!.length} ${AppLocalizations.of(context)!.recipes}'
                : '0 ${AppLocalizations.of(context)!.recipes}',
          ),
        ]),
        SizedBox(height: 20),
  _buildSectionTitle(context, AppLocalizations.of(context)!.myRecipes),
        _buildUserRecipesSection(),
        SizedBox(height: 40),
      ],
    );
  }

  Widget _buildUserRecipesSection() {
    if (_isLoadingRecipes) {
      return Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryGreen),
        ),
      );
    }

    if (_recipesErrorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_recipesErrorMessage!, textAlign: TextAlign.center),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: _loadAndFilterUserRecipes,
                child: Text(AppLocalizations.of(context)!.retry),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_userRecipes.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20.0),
          child: Text(
            AppLocalizations.of(context)!.noUserRecipesYet,
            style: TextStyle(color: Colors.grey.shade700, fontSize: 16),
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true, // Important for ListView inside ListView
      physics:
          NeverScrollableScrollPhysics(), // Disable scrolling for inner ListView
      itemCount: _userRecipes.length,
      itemBuilder: (context, index) {
        final recipe = _userRecipes[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16.0),
          child: RecipeCard(
            recipe: recipe,
            // onTap callback removed as RecipeCard handles its own tap
          ),
        );
      },
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
          color: AppTheme.primaryGreen,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildInfoCard(List<Widget> tiles) {
    return Card(
      elevation: 2.0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(children: tiles),
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String title, String subtitle) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryGreen),
      title: Text(title, style: TextStyle(fontWeight: FontWeight.w500)),
      subtitle: Text(
        subtitle.isNotEmpty ? subtitle : AppLocalizations.of(context)!.notSet,
        style: TextStyle(color: Colors.grey.shade700),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../models/user_profile.dart';
import '../models/recipe.dart'; // Added for Recipe model
import '../services/profile_service.dart';
import '../services/recipe_service.dart'; // Added for RecipeService
import '../theme/app_theme.dart';
import '../widgets/recipe_card.dart'; // Added for RecipeCard
import './profile_settings_screen.dart';
import './recipe_detail_screen.dart'; // Added for navigation to recipe details

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
        _errorMessage = 'Failed to load profile: $e';
      });
    }
  }

  Future<void> _loadAndFilterUserRecipes() async {
    if (_userProfile?.id == null) {
      if (mounted) {
        setState(() {
          _isLoadingRecipes = false;
          _recipesErrorMessage = 'User ID not available to load recipes.';
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
        _recipesErrorMessage = 'Failed to load recipes: $e';
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
          _userProfile == null && !_isLoading ? 'Profile' : 'My Profile',
          style: TextStyle(
            color: AppTheme.primaryGreen,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 2,
        iconTheme: IconThemeData(color: AppTheme.primaryGreen),
        actions:
            _userProfile != null
                ? [
                  IconButton(
                    icon: Icon(Icons.settings),
                    color: AppTheme.primaryGreen,
                    onPressed: _navigateToSettings,
                    tooltip: 'Profile Settings',
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
                child: Text('Retry'),
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
      return Center(child: Text('Profile data is not available.'));
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
            'Joined: ${MaterialLocalizations.of(context).formatShortDate(profile.joinedDate)}',
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: Colors.grey.shade600),
          ),
        ),
        SizedBox(height: 30),
        _buildSectionTitle(context, 'Personal Information'),
        _buildInfoCard([
          _buildInfoTile(Icons.person_outline, 'User Type', profile.userType),
          _buildInfoTile(
            Icons.public_outlined,
            'Profile Status',
            profile.publicProfile ? 'Public' : 'Private',
          ),
        ]),
        SizedBox(height: 20),
        _buildSectionTitle(context, 'Preferences'),
        _buildInfoCard([
          _buildInfoTile(
            Icons.restaurant_menu_outlined,
            'Dietary Preferences',
            profile.dietaryPreferences.join(', ').isNotEmpty
                ? profile.dietaryPreferences.join(', ')
                : 'None specified',
          ),
          _buildInfoTile(
            Icons.warning_amber_outlined,
            'Allergens',
            profile.allergens.join(', ').isNotEmpty
                ? profile.allergens.join(', ')
                : 'None specified',
          ),
          _buildInfoTile(
            Icons.no_food_outlined,
            'Disliked Foods',
            profile.dislikedFoods.isNotEmpty
                ? profile.dislikedFoods
                : 'None specified',
          ),
          _buildInfoTile(
            Icons.attach_money_outlined,
            'Monthly Budget',
            profile.monthlyBudget != null
                ? '\$${profile.monthlyBudget!.toStringAsFixed(2)}'
                : 'Not set',
          ),
        ]),
        SizedBox(height: 20),
        _buildSectionTitle(context, 'Activity Stats'),
        _buildInfoCard([
          _buildInfoTile(
            Icons.receipt_long_outlined, // Changed icon
            'Recipes Created',
            profile.recipeCount?.toString() ?? 'N/A',
          ),
          _buildInfoTile(
            Icons.star_border_outlined, // Changed icon
            'Average Recipe Rating',
            profile.avgRecipeRating != null
                ? '${profile.avgRecipeRating!.toStringAsFixed(1)} ★'
                : 'N/A',
          ),
          _buildInfoTile(
            Icons.soup_kitchen_outlined, // Changed icon
            'Cooking Skill',
            profile.typeOfCook ?? 'N/A',
          ),
        ]),
        SizedBox(height: 20),
        _buildSectionTitle(context, 'Community'),
        _buildInfoCard([
          _buildInfoTile(
            Icons.people_outline, // Changed icon
            'Following',
            profile.followedUsers != null
                ? '${profile.followedUsers!.length} users'
                : '0 users',
          ),
          _buildInfoTile(
            Icons.bookmark_border_outlined, // Changed icon
            'Bookmarked Recipes',
            profile.bookmarkRecipes != null
                ? '${profile.bookmarkRecipes!.length} recipes'
                : '0 recipes',
          ),
          _buildInfoTile(
            Icons.favorite_border_outlined, // Changed icon
            'Liked Recipes',
            profile.likedRecipes != null
                ? '${profile.likedRecipes!.length} recipes'
                : '0 recipes',
          ),
        ]),
        SizedBox(height: 20),
        _buildSectionTitle(context, 'My Recipes'),
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
                child: Text('Retry'),
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
            'You haven\'t created any recipes yet.',
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
        subtitle.isNotEmpty ? subtitle : 'N/A',
        style: TextStyle(color: Colors.grey.shade700),
      ),
    );
  }
}

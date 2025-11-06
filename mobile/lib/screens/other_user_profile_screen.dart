import 'package:flutter/material.dart';
import '../models/user_profile.dart';
import '../models/recipe.dart';
import '../services/profile_service.dart';
import '../services/recipe_service.dart';
import '../theme/app_theme.dart';
import '../widgets/recipe_card.dart';
import '../l10n/app_localizations.dart';

class OtherUserProfileScreen extends StatefulWidget {
  static const String routeName = '/other-user-profile';
  final int userId;
  final ProfileService profileService;

  OtherUserProfileScreen({
    Key? key,
    required this.userId,
    ProfileService? profileService,
  })  : profileService = profileService ?? ProfileService(),
        super(key: key);

  @override
  _OtherUserProfileScreenState createState() => _OtherUserProfileScreenState();
}

class _OtherUserProfileScreenState extends State<OtherUserProfileScreen> {
  late final ProfileService _profileService;
  late final RecipeService _recipeService;
  UserProfile? _userProfile;
  bool _isLoading = true;
  String? _errorMessage;

  List<Recipe> _userRecipes = [];
  bool _isLoadingRecipes = true;
  String? _recipesErrorMessage;

  bool _isFollowing = false;
  bool _isFollowLoading = false;

  @override
  void initState() {
    super.initState();
    _profileService = widget.profileService;
    _recipeService = RecipeService();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final profile = await _profileService.getUserProfileById(widget.userId);
      if (!mounted) return;
      setState(() {
        _userProfile = profile;
        _isLoading = false;
      });
      if (_userProfile != null) {
        await _checkIfFollowing();
        _loadAndFilterUserRecipes();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage =
            AppLocalizations.of(context)!.failedToLoadProfile(e.toString());
      });
    }
  }

  Future<void> _checkIfFollowing() async {
    try {
      // Load the current user's profile to check if they follow this user
      final currentUserProfile = await _profileService.getUserProfile();
      if (mounted) {
        setState(() {
          _isFollowing = currentUserProfile.followedUsers
                  ?.contains(widget.userId) ??
              false;
        });
      }
    } catch (e) {
      // If we can't load current user's profile, assume not following
      if (mounted) {
        setState(() {
          _isFollowing = false;
        });
      }
    }
  }

  Future<void> _loadAndFilterUserRecipes() async {
    if (!mounted) return;
    setState(() {
      _isLoadingRecipes = true;
      _recipesErrorMessage = null;
    });

    try {
      final allRecipes = await _recipeService.getAllRecipes(pageSize: 100);
      if (!mounted) return;

      final filteredRecipes = allRecipes
          .where((recipe) => recipe.creatorId == widget.userId)
          .toList();

      setState(() {
        _userRecipes = filteredRecipes;
        _isLoadingRecipes = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingRecipes = false;
        _recipesErrorMessage =
            AppLocalizations.of(context)!.failedToLoadRecipes(e.toString());
      });
    }
  }

  Future<void> _handleFollowUnfollow() async {
    setState(() {
      _isFollowLoading = true;
    });

    try {
      final result = await _profileService.followUnfollowUser(widget.userId);
      if (!mounted) return;

      setState(() {
        _isFollowing = result['status'] == 'followed';
        _isFollowLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _isFollowing
                ? AppLocalizations.of(context)!.followedSuccess
                : AppLocalizations.of(context)!.unfollowedSuccess,
          ),
          backgroundColor: AppTheme.primaryGreen,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isFollowLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.followActionFailed(e.toString()),
          ),
          backgroundColor: Colors.red,
        ),
      );
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
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundGrey,
      appBar: AppBar(
        title: Text(
          AppLocalizations.of(context)!.profileTitle,
          style: TextStyle(
            color: AppTheme.primaryGreen,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 2,
        iconTheme: IconThemeData(color: AppTheme.primaryGreen),
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
      return Center(
          child: Text(AppLocalizations.of(context)!.profileDataNotAvailable));
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
            child: _getProfileImageProvider() == null
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
        if (profile.publicProfile) ...[
          Center(
            child: Text(
              profile.email,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(color: Colors.grey.shade700),
            ),
          ),
          SizedBox(height: 10),
          Center(
            child: Text(
              '${AppLocalizations.of(context)!.joinedLabel}: ${MaterialLocalizations.of(context).formatShortDate(profile.joinedDate)}',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: Colors.grey.shade600),
            ),
          ),
        ],
        SizedBox(height: 20),
        Center(
          child: ElevatedButton.icon(
            onPressed: _isFollowLoading ? null : _handleFollowUnfollow,
            icon: _isFollowLoading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Icon(_isFollowing ? Icons.person_remove : Icons.person_add),
            label: Text(
              _isFollowing
                  ? AppLocalizations.of(context)!.unfollowButton
                  : AppLocalizations.of(context)!.followButton,
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor:
                  _isFollowing ? Colors.grey.shade600 : AppTheme.primaryGreen,
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(horizontal: 30, vertical: 12),
            ),
          ),
        ),
        if (profile.publicProfile) ...[
          SizedBox(height: 30),
          _buildSectionTitle(
              context, AppLocalizations.of(context)!.activityStats),
          _buildInfoCard([
            _buildInfoTile(
              Icons.receipt_long_outlined,
              AppLocalizations.of(context)!.recipesCreated,
              profile.recipeCount?.toString() ??
                  AppLocalizations.of(context)!.notSet,
            ),
            _buildInfoTile(
              Icons.star_border_outlined,
              AppLocalizations.of(context)!.avgRecipeRating,
              profile.avgRecipeRating != null
                  ? '${profile.avgRecipeRating!.toStringAsFixed(1)} ★'
                  : AppLocalizations.of(context)!.notSet,
            ),
            _buildInfoTile(
              Icons.soup_kitchen_outlined,
              AppLocalizations.of(context)!.cookingSkill,
              profile.typeOfCook ?? AppLocalizations.of(context)!.notSet,
            ),
          ]),
          SizedBox(height: 20),
          _buildSectionTitle(
              context, AppLocalizations.of(context)!.myRecipes),
          _buildUserRecipesSection(),
        ] else ...[
          SizedBox(height: 30),
          Center(
            child: Text(
              AppLocalizations.of(context)!.privateProfileMessage,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 16,
                fontStyle: FontStyle.italic,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
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
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      itemCount: _userRecipes.length,
      itemBuilder: (context, index) {
        final recipe = _userRecipes[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16.0),
          child: RecipeCard(recipe: recipe),
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

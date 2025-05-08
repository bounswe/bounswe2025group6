import 'package:flutter/material.dart';
import '../models/user_profile.dart';
import '../services/profile_service.dart';
import '../theme/app_theme.dart';
import './profile_settings_screen.dart';

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
  UserProfile? _userProfile;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _profileService = widget.profileService; // Initialize from the widget
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
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load profile: $e';
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
            Icons.home_work_outlined,
            'Household Size',
            profile.householdSize.toString(),
          ),
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
        SizedBox(height: 40),
      ],
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

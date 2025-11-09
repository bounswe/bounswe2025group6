import 'package:flutter/material.dart';
import '../services/profile_service.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';
import './other_user_profile_screen.dart';

class FollowingUsersScreen extends StatefulWidget {
  static const String routeName = '/following-users';
  final List<int> followedUserIds;

  const FollowingUsersScreen({
    Key? key,
    required this.followedUserIds,
  }) : super(key: key);

  @override
  _FollowingUsersScreenState createState() => _FollowingUsersScreenState();
}

class _FollowingUsersScreenState extends State<FollowingUsersScreen> {
  final ProfileService _profileService = ProfileService();
  Map<int, String> _usernames = {};
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadUsernames();
  }

  Future<void> _loadUsernames() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      Map<int, String> fetchedUsernames = {};
      
      for (int userId in widget.followedUserIds) {
        try {
          final profile = await _profileService.getUserProfileById(userId);
          fetchedUsernames[userId] = profile.username;
        } catch (e) {
          // If we can't fetch a specific user, skip it
          print('Error fetching user $userId: $e');
        }
      }

      if (mounted) {
        setState(() {
          _usernames = fetchedUsernames;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Failed to load users: $e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundGrey,
      appBar: AppBar(
        title: Text(
          AppLocalizations.of(context)!.followingLabel,
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
                onPressed: _loadUsernames,
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

    if (_usernames.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.people_outline,
                size: 64,
                color: Colors.grey.shade400,
              ),
              SizedBox(height: 16),
              Text(
                AppLocalizations.of(context)!.noUsersFollowedYet,
                style: TextStyle(
                  fontSize: 18,
                  color: Colors.grey.shade600,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(16.0),
      itemCount: _usernames.length,
      itemBuilder: (context, index) {
        final userId = _usernames.keys.elementAt(index);
        final username = _usernames[userId]!;
        
        return Card(
          margin: EdgeInsets.only(bottom: 12.0),
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0),
          ),
          child: ListTile(
            contentPadding: EdgeInsets.symmetric(
              horizontal: 16.0,
              vertical: 8.0,
            ),
            leading: CircleAvatar(
              backgroundColor: AppTheme.primaryGreen,
              child: Icon(
                Icons.person,
                color: Colors.white,
              ),
            ),
            title: Text(
              username,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
            trailing: Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: Colors.grey.shade600,
            ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => OtherUserProfileScreen(
                    userId: userId,
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

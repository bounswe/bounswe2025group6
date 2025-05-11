import 'package:flutter/material.dart';
import '../models/user_profile.dart';
import '../services/profile_service.dart';
import '../theme/app_theme.dart';

class ProfileSettingsScreen extends StatefulWidget {
  static const String routeName = '/profile-settings';
  final UserProfile userProfile;
  final ProfileService profileService; // Added

  const ProfileSettingsScreen({
    Key? key,
    required this.userProfile,
    required this.profileService, // Added
  }) : super(key: key);

  @override
  _ProfileSettingsScreenState createState() => _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState extends State<ProfileSettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  late ProfileService _profileService; // To be initialized from widget
  late UserProfile _editableProfile;

  final List<String> _avatarPaths = [
    'assets/avatars/cat.png',
    'assets/avatars/dog.png',
    'assets/avatars/meerkat.png',
    'assets/avatars/panda.png',
    'assets/avatars/gorilla.png',
  ];

  late TextEditingController _usernameController;
  late TextEditingController _emailController;
  late TextEditingController _dislikedFoodsController;
  late TextEditingController _monthlyBudgetController;

  List<String> _availableDietaryPreferences = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Keto',
    'Paleo',
    'Pescatarian',
  ];
  List<String> _availableAllergens = [
    'Peanuts',
    'Dairy',
    'Soy',
    'Shellfish',
    'Tree Nuts',
    'Wheat',
  ];

  @override
  void initState() {
    super.initState();
    _profileService = widget.profileService; // Initialize from widget
    _editableProfile = widget.userProfile.copyWith();
    _usernameController = TextEditingController(
      text: _editableProfile.username,
    );
    _emailController = TextEditingController(text: _editableProfile.email);
    _dislikedFoodsController = TextEditingController(
      text: _editableProfile.dislikedFoods,
    );
    _monthlyBudgetController = TextEditingController(
      text: _editableProfile.monthlyBudget?.toString() ?? '',
    );
  }

  void _selectAvatar(String avatarPath) {
    setState(() {
      _editableProfile = _editableProfile.copyWith(
        profilePictureUrl: avatarPath,
      );
    });
  }

  void _toggleSelection(List<String> list, String item) {
    setState(() {
      if (list.contains(item)) {
        list.remove(item);
      } else {
        list.add(item);
      }
    });
  }

  Future<void> _saveSettings() async {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      UserProfile finalProfileToSave = _editableProfile.copyWith(
        id: _editableProfile.id, // Explicitly pass the ID
        username: _usernameController.text,
        dislikedFoods: _dislikedFoodsController.text,
        monthlyBudget: double.tryParse(_monthlyBudgetController.text),
        clearMonthlyBudget: _monthlyBudgetController.text.isEmpty,
      );

      try {
        UserProfile updatedProfile = await _profileService.updateUserProfile(
          finalProfileToSave,
        );
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Settings saved!')));

          Navigator.pop(context, finalProfileToSave);
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to save settings: ${e.toString()}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Profile Settings',
          style: TextStyle(
            color: AppTheme.primaryGreen,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        iconTheme: IconThemeData(color: AppTheme.primaryGreen),
        actions: [
          IconButton(
            icon: Icon(Icons.save),
            onPressed: _saveSettings,
            color: AppTheme.primaryGreen,
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: EdgeInsets.all(16.0),
          children: <Widget>[
            Text(
              'Choose Your Avatar:',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            SizedBox(height: 10),
            Wrap(
              spacing: 10.0,
              runSpacing: 10.0,
              alignment: WrapAlignment.center,
              children:
                  _avatarPaths.map((path) {
                    bool isSelected =
                        _editableProfile.profilePictureUrl == path;
                    return GestureDetector(
                      onTap: () => _selectAvatar(path),
                      child: Opacity(
                        opacity: isSelected ? 1.0 : 0.7,
                        child: CircleAvatar(
                          radius: 40,
                          backgroundImage: AssetImage(
                            path,
                          ), // Ensure these assets exist
                          child:
                              isSelected
                                  ? CircleAvatar(
                                    radius: 40,
                                    backgroundColor: AppTheme.primaryGreen
                                        .withOpacity(0.5),
                                    child: Icon(
                                      Icons.check,
                                      color: Colors.white,
                                      size: 30,
                                    ),
                                  )
                                  : null,
                        ),
                      ),
                    );
                  }).toList(),
            ),
            SizedBox(height: 20),
            TextFormField(
              controller: _usernameController,
              decoration: InputDecoration(
                labelText: 'Username',
                border: OutlineInputBorder(),
              ),
              validator:
                  (value) =>
                      value == null || value.isEmpty
                          ? 'Username cannot be empty'
                          : null,
            ),
            SizedBox(height: 12),
            TextFormField(
              controller: _emailController,
              decoration: InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
              enabled: false, // Email usually not editable
            ),
            SizedBox(height: 20),
            Text(
              'Preferences',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            SizedBox(height: 10),
            TextFormField(
              controller: _dislikedFoodsController,
              decoration: InputDecoration(
                labelText: 'Disliked Foods (comma separated)',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 12),
            TextFormField(
              controller: _monthlyBudgetController,
              decoration: InputDecoration(
                labelText: 'Monthly Budget (\$) (Optional)',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.numberWithOptions(decimal: true),
            ),

            SizedBox(height: 12),
            SwitchListTile(
              title: Text('Public Profile'),
              value: _editableProfile.publicProfile,
              activeColor: AppTheme.primaryGreen,
              onChanged: (bool value) {
                setState(() {
                  _editableProfile = _editableProfile.copyWith(
                    publicProfile: value,
                  );
                });
              },
            ),
            SizedBox(height: 12),
            _buildChipSelection(
              'Dietary Preferences',
              _availableDietaryPreferences,
              _editableProfile.dietaryPreferences,
            ),
            SizedBox(height: 12),
            _buildChipSelection(
              'Allergens',
              _availableAllergens,
              _editableProfile.allergens,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChipSelection(
    String label,
    List<String> availableItems,
    List<String> selectedItems,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.titleMedium),
        SizedBox(height: 8),
        Wrap(
          spacing: 8.0,
          runSpacing: 4.0,
          children:
              availableItems.map((item) {
                final bool isSelected = selectedItems.contains(item);
                return FilterChip(
                  label: Text(item),
                  selected: isSelected,
                  onSelected: (bool selected) {
                    _toggleSelection(selectedItems, item);
                  },
                  selectedColor: AppTheme.primaryGreen.withOpacity(0.3),
                  checkmarkColor: AppTheme.primaryGreen,
                );
              }).toList(),
        ),
      ],
    );
  }
}

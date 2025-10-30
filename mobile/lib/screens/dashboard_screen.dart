import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/storage_service.dart';
import 'login_screen.dart';
import 'profile_screen.dart';
import 'discover_recipes_screen.dart';
import 'upload_recipe_screen.dart'; // Added import for UploadRecipeScreen
import 'meal_planner_screen.dart'; // Added import for MealPlannerScreen
import '../services/auth_service.dart';
import 'community/community_screen.dart';
import '../l10n/app_localizations.dart';

class DashboardScreen extends StatelessWidget {
  final AuthService? authService;

  const DashboardScreen({this.authService, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundGrey,
      appBar: AppBar(
        title: Row(
          children: [
            Text(
              // 'FitHub'
              AppLocalizations.of(context)!.appTitle,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryGreen,
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 2,
        actions: [
          // Add logout button
          IconButton(
            icon: const Icon(Icons.logout),
            color: AppTheme.primaryGreen,
            onPressed: () async {
              // Show confirmation dialog
              final bool? confirm = await showDialog<bool>(
                context: context,
                builder: (BuildContext context) {
                  return AlertDialog(
                    title: Text(AppLocalizations.of(context)!.logout),
                    content: Text(AppLocalizations.of(context)!.logoutConfirmation),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(false),
                        child: Text(AppLocalizations.of(context)!.cancel),
                      ),
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(true),
                        child: Text(AppLocalizations.of(context)!.logout),
                      ),
                    ],
                  );
                },
              );

              if (confirm == true && context.mounted) {
                try {
                  // Delete both tokens locally
                  await StorageService.deleteTokens();

                  if (!context.mounted) return;

                  // Navigate to login screen
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(
                      builder: (context) => const LoginScreen(),
                    ),
                    (route) => false,
                  );
                } catch (e) {
                  if (!context.mounted) return;

                  // Show error message
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(AppLocalizations.of(context)!.logoutFailed(e.toString())),
                      backgroundColor: AppTheme.errorColor,
                    ),
                  );
                }
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.menu),
            color: AppTheme.primaryGreen,
            onPressed: () {
              // TODO: Open drawer/menu
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome section
              Text(
                AppLocalizations.of(context)!.welcomeBack,
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              Text(
                // 'Manage your meals, recipes, and plans here.',
                AppLocalizations.of(context)!.dashboardSubtitle,
                style: TextStyle(fontSize: 16, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 24),

              // Quick action buttons
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                children: [
                  _buildDashboardCard(
                    icon: Icons.restaurant_menu,
                    title: AppLocalizations.of(context)!.discoverRecipes,
                    color: Colors.blue,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const DiscoverRecipesScreen(),
                        ),
                      );
                    },
                  ),
                  _buildDashboardCard(
                    icon: Icons.upload_file,
                    title: AppLocalizations.of(context)!.uploadRecipe,
                    color: AppTheme.primaryGreen,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const UploadRecipeScreen(),
                        ),
                      );
                    },
                  ),
                  _buildDashboardCard(
                    icon: Icons.group,
                    title: AppLocalizations.of(context)!.joinCommunity,
                    color: Colors.purple,
                    onTap: () {
                      Navigator.pushNamed(context, '/community');
                    },
                  ),
                  _buildDashboardCard(
                    icon: Icons.calendar_today,
                    title: AppLocalizations.of(context)!.planMeal,
                    color: Colors.orange,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const MealPlannerScreen(),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        selectedItemColor: AppTheme.primaryGreen,
        unselectedItemColor: AppTheme.textSecondary,
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: AppLocalizations.of(context)!.home,
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.group),
            label: AppLocalizations.of(context)!.community,
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: AppLocalizations.of(context)!.profile,
          ),
        ],
        onTap: (index) {
          switch (index) {
            case 1:
              Navigator.pushNamed(context, '/community');
              break;
            case 2:
              Navigator.pushNamed(context, ProfileScreen.routeName);
              break;
          }
        },
      ),
    );
  }

  Widget _buildDashboardCard({
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 40, color: color),
              const SizedBox(height: 12),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

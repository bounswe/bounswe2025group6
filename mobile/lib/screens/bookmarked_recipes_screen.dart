import 'package:flutter/material.dart';
import '../models/recipe.dart';
import '../services/recipe_service.dart';
import '../services/profile_service.dart';
import '../widgets/recipe_card.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';

class BookmarkedRecipesScreen extends StatefulWidget {
  const BookmarkedRecipesScreen({Key? key}) : super(key: key);

  @override
  _BookmarkedRecipesScreenState createState() =>
      _BookmarkedRecipesScreenState();
}

class _BookmarkedRecipesScreenState extends State<BookmarkedRecipesScreen> {
  final RecipeService _recipeService = RecipeService();
  final ProfileService _profileService = ProfileService();
  
  List<Recipe> _bookmarkedRecipes = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadBookmarkedRecipes();
  }

  Future<void> _loadBookmarkedRecipes() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final profile = await _profileService.getUserProfile();
      
      if (profile.bookmarkRecipes == null || profile.bookmarkRecipes!.isEmpty) {
        if (mounted) {
          setState(() {
            _bookmarkedRecipes = [];
            _isLoading = false;
          });
        }
        return;
      }

      // Load each bookmarked recipe by ID
      List<Recipe> loadedRecipes = [];
      for (int recipeId in profile.bookmarkRecipes!) {
        try {
          final recipe = await _recipeService.getRecipeDetails(recipeId);
          loadedRecipes.add(recipe);
        } catch (e) {
          print('Error loading recipe $recipeId: $e');
          // Continue loading other recipes even if one fails
        }
      }

      if (mounted) {
        setState(() {
          _bookmarkedRecipes = loadedRecipes;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = AppLocalizations.of(context)!.failedToLoadBookmarkedRecipes(e.toString());
        });
      }
    }
  }

  Future<void> _refreshRecipes() async {
    await _loadBookmarkedRecipes();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.bookmarkedRecipesLabel),
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
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
              Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red,
              ),
              SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16),
              ),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: _loadBookmarkedRecipes,
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

    if (_bookmarkedRecipes.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.bookmark_border,
                size: 64,
                color: Colors.grey,
              ),
              SizedBox(height: 16),
              Text(
                AppLocalizations.of(context)!.noBookmarkedRecipesYet,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade700,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _refreshRecipes,
      child: ListView.builder(
        padding: EdgeInsets.symmetric(vertical: 8),
        itemCount: _bookmarkedRecipes.length,
        itemBuilder: (context, index) {
          final recipe = _bookmarkedRecipes[index];
          return RecipeCard(recipe: recipe);
        },
      ),
    );
  }
}

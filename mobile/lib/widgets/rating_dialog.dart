import 'package:flutter/material.dart';
import '../services/rating_service.dart';
import '../services/health_rating_service.dart';
import '../services/profile_service.dart';
import '../models/recipe_rating.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';

class RatingDialog extends StatefulWidget {
  final int recipeId;
  final RecipeRating? existingRating;
  final VoidCallback? onRatingSubmitted;

  const RatingDialog({
    Key? key,
    required this.recipeId,
    this.existingRating,
    this.onRatingSubmitted,
  }) : super(key: key);

  @override
  State<RatingDialog> createState() => _RatingDialogState();
}

class _RatingDialogState extends State<RatingDialog> {
  final RatingService _ratingService = RatingService();
  final HealthRatingService _healthRatingService = HealthRatingService();
  final ProfileService _profileService = ProfileService();
  double? _tasteRating;
  double? _difficultyRating;
  double? _healthRating;
  int? _existingHealthRatingId; // Store ID of existing health rating
  bool _isLoading = false;
  bool _isDietitian = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    await _checkUserType();
    // Initialize with existing ratings if available
    if (widget.existingRating != null) {
      setState(() {
        _tasteRating = widget.existingRating!.tasteRating;
        _difficultyRating = widget.existingRating!.difficultyRating;
      });
    }
    // Load health rating separately if user is dietitian
    if (_isDietitian) {
      await _loadHealthRating();
    }
  }

  Future<void> _checkUserType() async {
    try {
      final profile = await _profileService.getUserProfile();
      setState(() {
        _isDietitian = profile.userType.toLowerCase() == 'dietitian';
      });
    } catch (e) {
      // If we can't fetch profile, assume not dietitian
      setState(() {
        _isDietitian = false;
      });
    }
  }

  Future<void> _loadHealthRating() async {
    try {
      final healthRating = await _healthRatingService.getHealthRatingForRecipe(
        widget.recipeId,
      );
      if (healthRating != null && mounted) {
        setState(() {
          _healthRating = healthRating.healthScore;
          _existingHealthRatingId = healthRating.id;
        });
      }
    } catch (e) {
      // No health rating exists yet, or error loading
      // This is fine, user can create a new one
    }
  }

  Future<void> _deleteRating() async {
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('Delete Rating'),
            content: Text(
              _isDietitian && _existingHealthRatingId != null
                  ? 'Are you sure you want to delete your ratings? This will delete both your recipe rating and health rating.'
                  : 'Are you sure you want to delete your rating? This action cannot be undone.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Delete'),
              ),
            ],
          ),
    );

    if (confirmed != true) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Delete recipe rating
      await _ratingService.deleteRating(widget.existingRating!.id!);

      // Delete health rating if it exists (for dietitians)
      if (_isDietitian && _existingHealthRatingId != null) {
        try {
          await _healthRatingService.deleteHealthRating(
            _existingHealthRatingId!,
          );
        } catch (e) {
          // Health rating might not exist or already deleted, continue
        }
      }

      if (mounted) {
        // Call callback before closing
        widget.onRatingSubmitted?.call();

        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Rating deleted successfully!'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );

        // Close dialog
        Navigator.of(context).pop(true);
      }
    } on RatingException catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.message;
          _isLoading = false;
        });
      }
    } on HealthRatingException catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.message;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to delete rating: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _submitRating() async {
    // Validate that at least one rating is provided
    final hasRecipeRating = _tasteRating != null || _difficultyRating != null;
    final hasHealthRating = _isDietitian && _healthRating != null;

    if (!hasRecipeRating && !hasHealthRating && widget.existingRating == null) {
      setState(() {
        _errorMessage = 'Please provide at least one rating';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Save recipe rating (taste and difficulty)
      if (hasRecipeRating || widget.existingRating != null) {
        if (widget.existingRating != null) {
          // Update existing recipe rating
          await _ratingService.updateRating(
            ratingId: widget.existingRating!.id!,
            recipeId: widget.recipeId,
            tasteRating: _tasteRating,
            difficultyRating: _difficultyRating,
          );
        } else if (hasRecipeRating) {
          // Create new recipe rating
          await _ratingService.createRating(
            recipeId: widget.recipeId,
            tasteRating: _tasteRating,
            difficultyRating: _difficultyRating,
          );
        }
      }

      // Save health rating separately (only for dietitians)
      if (_isDietitian && _healthRating != null) {
        if (_existingHealthRatingId != null) {
          // Update existing health rating
          await _healthRatingService.updateHealthRating(
            ratingId: _existingHealthRatingId!,
            recipeId: widget.recipeId,
            healthScore: _healthRating!,
          );
        } else {
          // Create new health rating
          await _healthRatingService.createHealthRating(
            recipeId: widget.recipeId,
            healthScore: _healthRating!,
          );
        }
      }

      if (mounted) {
        // Call callback before closing
        widget.onRatingSubmitted?.call();

        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.existingRating != null
                  ? 'Rating updated successfully!'
                  : 'Rating submitted successfully!',
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );

        // Close dialog
        Navigator.of(context).pop(true);
      }
    } on RatingException catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.message;
          _isLoading = false;
        });
      }
    } on HealthRatingException catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.message;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'An unexpected error occurred. Please try again.';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        widget.existingRating != null
            ? AppLocalizations.of(context)!.editRating
            : AppLocalizations.of(context)!.rateRecipe,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Error message
            if (_errorMessage != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red.shade700),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: TextStyle(color: Colors.red.shade700),
                      ),
                    ),
                  ],
                ),
              ),

            // Taste Rating Section
            Text(
              AppLocalizations.of(context)!.tasteRating,
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Slider(
                    value: _tasteRating ?? 0.0,
                    min: 0.0,
                    max: 5.0,
                    divisions: 50,
                    label:
                        _tasteRating != null
                            ? _tasteRating!.toStringAsFixed(1)
                            : 'Not set',
                    activeColor: AppTheme.primaryGreen,
                    onChanged: (value) {
                      setState(() {
                        _tasteRating = value;
                        _errorMessage = null;
                      });
                    },
                  ),
                ),
                SizedBox(
                  width: 60,
                  child: Text(
                    _tasteRating != null
                        ? _tasteRating!.toStringAsFixed(1)
                        : 'N/A',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final starValue = index + 1;
                final isFilled =
                    _tasteRating != null && _tasteRating! >= starValue;
                final isPartiallyFilled =
                    _tasteRating != null &&
                    _tasteRating! > index &&
                    _tasteRating! < starValue;

                return Icon(
                  isPartiallyFilled
                      ? Icons.star_half
                      : (isFilled ? Icons.star : Icons.star_border),
                  color: AppTheme.primaryGreen,
                  size: 28,
                );
              }),
            ),
            if (_tasteRating != null)
              TextButton(
                onPressed: () {
                  setState(() {
                    _tasteRating = null;
                  });
                },
                child: Text(AppLocalizations.of(context)!.clearTasteRating),
              ),

            const Divider(height: 32),

            // Difficulty Rating Section
            Text(
              AppLocalizations.of(context)!.difficultyRating,
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Slider(
                    value: _difficultyRating ?? 0.0,
                    min: 0.0,
                    max: 5.0,
                    divisions: 50,
                    label:
                        _difficultyRating != null
                            ? _difficultyRating!.toStringAsFixed(1)
                            : 'Not set',
                    activeColor: Colors.orange.shade700,
                    onChanged: (value) {
                      setState(() {
                        _difficultyRating = value;
                        _errorMessage = null;
                      });
                    },
                  ),
                ),
                SizedBox(
                  width: 60,
                  child: Text(
                    _difficultyRating != null
                        ? _difficultyRating!.toStringAsFixed(1)
                        : 'N/A',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final starValue = index + 1;
                final isFilled =
                    _difficultyRating != null &&
                    _difficultyRating! >= starValue;
                final isPartiallyFilled =
                    _difficultyRating != null &&
                    _difficultyRating! > index &&
                    _difficultyRating! < starValue;

                return Icon(
                  isPartiallyFilled
                      ? Icons.star_half
                      : (isFilled ? Icons.star : Icons.star_border),
                  color: Colors.orange.shade700,
                  size: 28,
                );
              }),
            ),
            if (_difficultyRating != null)
              TextButton(
                onPressed: () {
                  setState(() {
                    _difficultyRating = null;
                  });
                },
                child: Text(
                  AppLocalizations.of(context)!.clearDifficultyRating,
                ),
              ),

            // Health Rating Section (Only for Dietitians)
            if (_isDietitian) ...[
              const Divider(height: 32),
              Text(
                '${AppLocalizations.of(context)!.healthRating} (Dietitian Only)',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: Slider(
                      value: _healthRating ?? 0.0,
                      min: 0.0,
                      max: 5.0,
                      divisions: 50,
                      label:
                          _healthRating != null
                              ? _healthRating!.toStringAsFixed(1)
                              : 'Not set',
                      activeColor: Colors.green.shade700,
                      onChanged: (value) {
                        setState(() {
                          _healthRating = value;
                          _errorMessage = null;
                        });
                      },
                    ),
                  ),
                  SizedBox(
                    width: 60,
                    child: Text(
                      _healthRating != null
                          ? _healthRating!.toStringAsFixed(1)
                          : 'N/A',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  final starValue = index + 1;
                  final isFilled =
                      _healthRating != null && _healthRating! >= starValue;
                  final isPartiallyFilled =
                      _healthRating != null &&
                      _healthRating! > index &&
                      _healthRating! < starValue;

                  return Icon(
                    isPartiallyFilled
                        ? Icons.star_half
                        : (isFilled ? Icons.star : Icons.star_border),
                    color: Colors.green.shade700,
                    size: 28,
                  );
                }),
              ),
              if (_healthRating != null)
                TextButton(
                  onPressed: () {
                    setState(() {
                      _healthRating = null;
                    });
                  },
                  child: Text(AppLocalizations.of(context)!.clearHealthRating),
                ),
            ],
          ],
        ),
      ),
      actions: [
        // Delete button (only show if editing existing rating)
        if (widget.existingRating != null)
          TextButton(
            onPressed: _isLoading ? null : _deleteRating,
            child: Text(
              AppLocalizations.of(context)!.delete,
              style: TextStyle(color: Colors.red),
            ),
          ),
        const Spacer(),
        TextButton(
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(false),
          child: Text(AppLocalizations.of(context)!.cancel),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _submitRating,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryGreen,
            foregroundColor: Colors.white,
          ),
          child:
              _isLoading
                  ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                  : Text(
                    widget.existingRating != null
                        ? AppLocalizations.of(context)!.update
                        : AppLocalizations.of(context)!.rateRecipe,
                  ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import 'package:fithub/theme/app_theme.dart';
import 'package:fithub/services/recipe_service.dart';
import 'package:fithub/services/profile_service.dart';
import 'package:fithub/models/user_profile.dart';
import 'package:fithub/models/ingredient.dart'; // Import IngredientDetail
import 'package:flutter_typeahead/flutter_typeahead.dart'; // Import flutter_typeahead
import '../l10n/app_localizations.dart';

class UploadRecipeScreen extends StatefulWidget {
  const UploadRecipeScreen({super.key});

  @override
  State<UploadRecipeScreen> createState() => _UploadRecipeScreenState();
}

class _UploadRecipeScreenState extends State<UploadRecipeScreen> {
  final _formKey = GlobalKey<FormState>();

  // Form field controllers
  final _nameController = TextEditingController();
  final _prepTimeController = TextEditingController();
  final _cookTimeController = TextEditingController();
  final _stepsController = TextEditingController();
  String? _selectedMealType;
  List<Map<String, dynamic>> _ingredients =
      []; // Changed to dynamic to store controllers and selected ingredient
  bool _isSubmitting = false; // To track submission state
  List<IngredientDetail> _allIngredients = [];
  bool _isLoadingIngredients = true;
  final RecipeService _recipeService = RecipeService();

  // Image selection
  File? _selectedImage;
  String? _selectedImagePath;

  @override
  void initState() {
    super.initState();
    _fetchIngredients();
    // Add one initial ingredient field
    _addIngredientField();
  }

  Future<void> _fetchIngredients() async {
    try {
      final ingredients = await _recipeService.getAllIngredients(
        pageSize: 1000,
      ); // Fetch a large number to get all
      if (mounted) {
        setState(() {
          _allIngredients = ingredients;
          _isLoadingIngredients = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingIngredients = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(
                context,
              )!.failedToLoadIngredients(e.toString()),
            ),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _prepTimeController.dispose();
    _cookTimeController.dispose();
    _stepsController.dispose();
    for (var ingredientEntry in _ingredients) {
      ingredientEntry['name']!.dispose();
      ingredientEntry['quantity']!.dispose();
      ingredientEntry['unit']!.dispose();
    }
    super.dispose();
  }

  void _addIngredientField() {
    setState(() {
      _ingredients.add({
        'name': TextEditingController(),
        'quantity': TextEditingController(),
        'unit': TextEditingController(),
        'selectedIngredient': null, // Store selected IngredientDetail
        'selectedUnit': null, // Store selected unit string
      });
    });
  }

  void _removeIngredientField(int index) {
    setState(() {
      _ingredients[index]['name']!.dispose();
      _ingredients[index]['quantity']!.dispose();
      _ingredients[index]['unit']!.dispose();
      _ingredients.removeAt(index);
    });
  }

  Future<void> _pickImage() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
      );

      if (result != null && result.files.single.path != null) {
        setState(() {
          _selectedImagePath = result.files.single.path;
          _selectedImage = File(_selectedImagePath!);
        });
      }
    } catch (e) {
      print('Error picking image: $e');
      if (mounted) {
        // ScaffoldMessenger.of(context).showSnackBar(
        //   SnackBar(content: Text('Failed to pick image: ${e.toString()}')),
        // );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context)!.failedToPickImage(e.toString()),
            ),
          ),
        );
      }
    }
  }

  void _removeImage() {
    setState(() {
      _selectedImage = null;
      _selectedImagePath = null;
    });
  }

  Future<void> _submitForm() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isSubmitting = true;
      });

      final recipeData = {
        'name': _nameController.text,
        'prep_time': int.tryParse(_prepTimeController.text) ?? 0,
        'cook_time': int.tryParse(_cookTimeController.text) ?? 0,
        'meal_type': _selectedMealType,
        'steps':
            _stepsController.text.trim().isEmpty
                ? []
                : _stepsController.text
                    .split('\n')
                    .where((step) => step.trim().isNotEmpty)
                    .toList(),
        'ingredients':
            _ingredients
                .map(
                  (ing) => {
                    'ingredient_name': ing['name']!.text,
                    'quantity': double.tryParse(ing['quantity']!.text) ?? 0,
                    'unit': ing['unit']!.text,
                  },
                )
                .toList(),
      };

      try {
        final success = await RecipeService().createRecipe(
          recipeData,
          imagePath: _selectedImagePath, // Pass the image path
        );
        if (success) {
          try {
            final profileService = ProfileService();
            UserProfile userProfile = await profileService.getUserProfile();
            int newRecipeCount = (userProfile.recipeCount ?? 0) + 1;
            userProfile = userProfile.copyWith(recipeCount: newRecipeCount);
            await profileService.updateUserProfile(userProfile);
          } catch (e) {
            print('Error updating recipe count: $e'); // Log the error
            // Show a snackbar to the user about the count update failure
            if (mounted) {
              // Check if the widget is still in the tree
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    AppLocalizations.of(
                      context,
                    )!.recipeUploadedButProfileCountFailed(e.toString()),
                  ),
                  backgroundColor: AppTheme.warningColor, // Use a warning color
                ),
              );
            }
          }
          // Show success message regardless of count update success for now
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                AppLocalizations.of(context)!.recipeUploadedSuccess,
              ),
            ),
          );
          Navigator.of(context).pop(); // Go back after successful upload
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context)!.failedToUploadRecipe),
            ),
          );
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context)!.genericError(e.toString()),
            ),
          ),
        );
      } finally {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.uploadRecipeTitle),
        backgroundColor: AppTheme.primaryGreen,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: AppLocalizations.of(context)!.recipeNameLabel,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return AppLocalizations.of(
                        context,
                      )!.enterRecipeNameValidation;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Image Picker Section
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          // 'Recipe Image (Optional)',
                          AppLocalizations.of(context)!.recipeImageOptional,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (_selectedImage != null) ...[
                          Stack(
                            alignment: Alignment.topRight,
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: ConstrainedBox(
                                  constraints: const BoxConstraints(
                                    maxHeight: 300,
                                    minHeight: 150,
                                  ),
                                  child: Image.file(
                                    _selectedImage!,
                                    width: double.infinity,
                                    fit: BoxFit.contain,
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 8,
                                right: 8,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.red.withOpacity(0.8),
                                    shape: BoxShape.circle,
                                  ),
                                  child: IconButton(
                                    icon: const Icon(
                                      Icons.close,
                                      color: Colors.white,
                                      size: 20,
                                    ),
                                    onPressed: _removeImage,
                                    padding: const EdgeInsets.all(4),
                                    constraints: const BoxConstraints(),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ] else ...[
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: _pickImage,
                              icon: const Icon(Icons.add_photo_alternate),
                              label: Text(
                                AppLocalizations.of(context)!.addImage,
                                overflow: TextOverflow.ellipsis,
                              ),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                  horizontal: 12,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                TextFormField(
                  controller: _prepTimeController,
                  decoration: InputDecoration(
                    labelText:
                        AppLocalizations.of(context)!.preparationTimeLabel,
                  ),
                  keyboardType: TextInputType.number,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return AppLocalizations.of(context)!.enterPreparationTime;
                    }
                    final n = int.tryParse(value);
                    if (n == null) {
                      return AppLocalizations.of(context)!.enterValidNumber;
                    }
                    if (n <= 0) {
                      return AppLocalizations.of(context)!.timeMustBePositive;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _cookTimeController,
                  decoration: InputDecoration(
                    labelText: AppLocalizations.of(context)!.cookingTimeLabel,
                  ),
                  keyboardType: TextInputType.number,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return AppLocalizations.of(context)!.enterPreparationTime;
                    }
                    final n = int.tryParse(value);
                    if (n == null) {
                      return AppLocalizations.of(context)!.enterValidNumber;
                    }
                    if (n <= 0) {
                      return AppLocalizations.of(context)!.timeMustBePositive;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  decoration: InputDecoration(
                    labelText: AppLocalizations.of(context)!.mealTypeLabel,
                  ),
                  value: _selectedMealType,
                  items:
                      ['breakfast', 'lunch', 'dinner']
                          .map(
                            (label) => DropdownMenuItem(
                              value: label,
                              child: Text(
                                label == 'breakfast'
                                    ? AppLocalizations.of(context)!.breakfast
                                    : label == 'lunch'
                                    ? AppLocalizations.of(context)!.lunch
                                    : AppLocalizations.of(context)!.dinner,
                              ),
                            ),
                          )
                          .toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedMealType = value;
                    });
                  },
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return AppLocalizations.of(
                        context,
                      )!.selectMealTypeValidation;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _stepsController,
                  decoration: InputDecoration(
                    labelText: AppLocalizations.of(context)!.stepsLabel,
                    hintText: AppLocalizations.of(context)!.stepsHint,
                  ),
                  maxLines: null, // Allows for multi-line input
                  keyboardType: TextInputType.multiline,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return AppLocalizations.of(context)!.enterStepsValidation;
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                Text(
                  AppLocalizations.of(context)!.ingredientsTitle,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _ingredients.length,
                  itemBuilder: (context, index) {
                    return Card(
                      margin: const EdgeInsets.symmetric(vertical: 8.0),
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Column(
                          children: [
                            _isLoadingIngredients
                                ? const Center(
                                  child: CircularProgressIndicator(),
                                )
                                : TypeAheadField<IngredientDetail>(
                                  controller:
                                      _ingredients[index]['name'], // Pass the controller here
                                  suggestionsCallback: (pattern) {
                                    if (pattern.isEmpty) {
                                      return [];
                                    }
                                    return _allIngredients
                                        .where(
                                          (ingredient) => ingredient.name
                                              .toLowerCase()
                                              .contains(pattern.toLowerCase()),
                                        )
                                        .toList(); // Added .toList()
                                  },
                                  builder: (context, controller, focusNode) {
                                    // Assign the provided controller to our TextEditingController instance
                                    // This is a bit tricky because _ingredients[index]['name'] is already a controller.
                                    // The TypeAheadField's controller parameter handles this.
                                    // We use the provided focusNode.
                                    return TextFormField(
                                      controller:
                                          controller, // Use the controller from TypeAheadField's builder
                                      focusNode: focusNode,
                                      // decoration: const InputDecoration(
                                      //   labelText: 'Ingredient Name',
                                      // ),
                                      decoration: InputDecoration(
                                        labelText:
                                            AppLocalizations.of(
                                              context,
                                            )!.ingredientNameLabel,
                                      ),
                                      validator: (value) {
                                        if (value == null || value.isEmpty) {
                                          // return 'Enter ingredient name';
                                          return AppLocalizations.of(
                                            context,
                                          )!.enterIngredientNameValidation;
                                        }
                                        // Optional: Validate if the entered ingredient is in the list
                                        // if (!_allIngredients.any((ing) => ing.name.toLowerCase() == value.toLowerCase())) {
                                        //   return 'Please select a valid ingredient from the list';
                                        // }
                                        return null;
                                      },
                                    );
                                  },
                                  itemBuilder: (context, suggestion) {
                                    return ListTile(
                                      title: Text(suggestion.name),
                                    );
                                  },
                                  onSelected: (suggestion) {
                                    // Changed from onSuggestionSelected
                                    // The controller for the field is _ingredients[index]['name']
                                    // TypeAheadField updates its 'controller' parameter automatically.
                                    setState(() {
                                      _ingredients[index]['name']!.text =
                                          suggestion.name;
                                      _ingredients[index]['selectedIngredient'] =
                                          suggestion;
                                      // Reset unit selection when ingredient changes
                                      _ingredients[index]['selectedUnit'] =
                                          null;
                                      _ingredients[index]['unit']!.clear();
                                    });
                                  },
                                  emptyBuilder: // Changed from noItemsFoundBuilder
                                      (context) => Padding(
                                        padding: const EdgeInsets.all(8.0),
                                        child: Text(
                                          AppLocalizations.of(
                                            context,
                                          )!.noIngredientsFound,
                                          textAlign: TextAlign.center,
                                        ),
                                      ),
                                ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _ingredients[index]['quantity'],
                                    decoration: InputDecoration(
                                      labelText:
                                          AppLocalizations.of(
                                            context,
                                          )!.quantityLabel,
                                    ),
                                    keyboardType:
                                        const TextInputType.numberWithOptions(
                                          decimal: true,
                                        ),
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return AppLocalizations.of(
                                          context,
                                        )!.enterQuantityValidation;
                                      }
                                      final n = double.tryParse(value);
                                      if (n == null) {
                                        return AppLocalizations.of(
                                          context,
                                        )!.enterValidNumber;
                                      }
                                      if (n <= 0) {
                                        return AppLocalizations.of(
                                          context,
                                        )!.quantityPositiveValidation;
                                      }
                                      return null;
                                    },
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child:
                                      _ingredients[index]['selectedIngredient'] !=
                                                  null &&
                                              (_ingredients[index]['selectedIngredient']
                                                      as IngredientDetail)
                                                  .allowedUnits
                                                  .isNotEmpty
                                          ? DropdownButtonFormField<String>(
                                            value:
                                                _ingredients[index]['selectedUnit'],
                                            decoration: InputDecoration(
                                              labelText:
                                                  AppLocalizations.of(
                                                    context,
                                                  )!.unitLabel,
                                            ),
                                            items:
                                                (_ingredients[index]['selectedIngredient']
                                                        as IngredientDetail)
                                                    .allowedUnits
                                                    .map(
                                                      (unit) =>
                                                          DropdownMenuItem(
                                                            value: unit,
                                                            child: Text(unit),
                                                          ),
                                                    )
                                                    .toList(),
                                            onChanged: (value) {
                                              setState(() {
                                                _ingredients[index]['selectedUnit'] =
                                                    value;
                                                _ingredients[index]['unit']!
                                                    .text = value ?? '';
                                              });
                                            },
                                            validator: (value) {
                                              if (value == null ||
                                                  value.isEmpty) {
                                                return AppLocalizations.of(
                                                  context,
                                                )!.enterIngredientNameValidation;
                                              }
                                              return null;
                                            },
                                          )
                                          : TextFormField(
                                            controller:
                                                _ingredients[index]['unit'],
                                            decoration: InputDecoration(
                                              labelText:
                                                  AppLocalizations.of(
                                                    context,
                                                  )!.unitLabel,
                                              hintText:
                                                  'Select ingredient first',
                                            ),
                                            enabled: false,
                                            validator: (value) {
                                              if (value == null ||
                                                  value.isEmpty) {
                                                return AppLocalizations.of(
                                                  context,
                                                )!.enterIngredientNameValidation;
                                              }
                                              return null;
                                            },
                                          ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if (_ingredients.length > 1)
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton.icon(
                                  icon: const Icon(
                                    Icons.remove_circle_outline,
                                    color: AppTheme.errorColor,
                                  ),
                                  label: Text(
                                    AppLocalizations.of(context)!.removeLabel,
                                    style: const TextStyle(
                                      color: AppTheme.errorColor,
                                    ),
                                  ),
                                  onPressed:
                                      () => _removeIngredientField(index),
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 16),
                TextButton.icon(
                  icon: const Icon(Icons.add_circle_outline),
                  label: Text(AppLocalizations.of(context)!.addIngredientLabel),
                  onPressed: _addIngredientField,
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.primaryGreen,
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed:
                      _isSubmitting
                          ? null
                          : _submitForm, // Disable button when submitting
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.buttonGrey,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child:
                      _isSubmitting
                          ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.0,
                            ),
                          )
                          : Text(
                            AppLocalizations.of(context)!.uploadRecipeButton,
                            style: TextStyle(color: Colors.white),
                          ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

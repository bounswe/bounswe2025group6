import 'package:flutter/material.dart';
import 'package:fithub/theme/app_theme.dart';
import 'package:fithub/services/recipe_service.dart';
import 'package:fithub/services/profile_service.dart';
import 'package:fithub/models/user_profile.dart';
import 'package:fithub/models/ingredient.dart'; // Import IngredientDetail
import 'package:flutter_typeahead/flutter_typeahead.dart'; // Import flutter_typeahead

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
  List<Map<String, TextEditingController>> _ingredients = [];
  bool _isSubmitting = false; // To track submission state
  List<IngredientDetail> _allIngredients = [];
  bool _isLoadingIngredients = true;
  final RecipeService _recipeService = RecipeService();

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
            content: Text('Failed to load ingredients: ${e.toString()}'),
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
        final success = await RecipeService().createRecipe(recipeData);
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
                    'Recipe uploaded, but failed to update profile count: ${e.toString()}',
                  ),
                  backgroundColor: AppTheme.warningColor, // Use a warning color
                ),
              );
            }
          }
          // Show success message regardless of count update success for now
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Recipe uploaded successfully!')),
          );
          Navigator.of(context).pop(); // Go back after successful upload
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to upload recipe.')),
          );
        }
      } catch (e) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
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
        title: const Text('Upload New Recipe'),
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
                  decoration: const InputDecoration(labelText: 'Recipe Name'),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter the recipe name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _prepTimeController,
                  decoration: const InputDecoration(
                    labelText: 'Preparation Time (minutes)',
                  ),
                  keyboardType: TextInputType.number,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter preparation time';
                    }
                    final n = int.tryParse(value);
                    if (n == null) {
                      return 'Please enter a valid number';
                    }
                    if (n <= 0) {
                      return 'Time must be positive';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _cookTimeController,
                  decoration: const InputDecoration(
                    labelText: 'Cooking Time (minutes)',
                  ),
                  keyboardType: TextInputType.number,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter cooking time';
                    }
                    final n = int.tryParse(value);
                    if (n == null) {
                      return 'Please enter a valid number';
                    }
                    if (n <= 0) {
                      return 'Time must be positive';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(labelText: 'Meal Type'),
                  value: _selectedMealType,
                  items:
                      ['breakfast', 'lunch', 'dinner']
                          .map(
                            (label) => DropdownMenuItem(
                              value: label,
                              child: Text(
                                label[0].toUpperCase() + label.substring(1),
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
                      return 'Please select a meal type';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _stepsController,
                  decoration: const InputDecoration(
                    labelText: 'Steps',
                    hintText: 'Enter each step on a new line...',
                  ),
                  maxLines: null, // Allows for multi-line input
                  keyboardType: TextInputType.multiline,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter the steps';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                Text(
                  'Ingredients',
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
                                      decoration: const InputDecoration(
                                        labelText: 'Ingredient Name',
                                      ),
                                      validator: (value) {
                                        if (value == null || value.isEmpty) {
                                          return 'Enter ingredient name';
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
                                    _ingredients[index]['name']!.text =
                                        suggestion.name;
                                  },
                                  emptyBuilder: // Changed from noItemsFoundBuilder
                                      (context) => const Padding(
                                        padding: EdgeInsets.all(8.0),
                                        child: Text(
                                          'No ingredients found.',
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
                                    decoration: const InputDecoration(
                                      labelText: 'Quantity',
                                    ),
                                    keyboardType:
                                        const TextInputType.numberWithOptions(
                                          decimal: true,
                                        ),
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Enter quantity';
                                      }
                                      final n = double.tryParse(value);
                                      if (n == null) {
                                        return 'Enter a valid number';
                                      }
                                      if (n <= 0) {
                                        return 'Quantity must be positive';
                                      }
                                      return null;
                                    },
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: TextFormField(
                                    controller: _ingredients[index]['unit'],
                                    decoration: const InputDecoration(
                                      labelText: 'Unit (e.g., pcs, cup)',
                                    ),
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Enter unit';
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
                                  label: const Text(
                                    'Remove',
                                    style: TextStyle(color: AppTheme.errorColor),
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
                  label: const Text('Add Ingredient'),
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
                          : const Text(
                            'Upload Recipe',
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

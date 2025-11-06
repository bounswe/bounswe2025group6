import 'package:flutter/material.dart';
import '../models/recipe.dart';
import '../services/recipe_service.dart';
import '../widgets/recipe_card.dart'; // Ensure this path is correct
import '../theme/app_theme.dart'; // Import AppTheme
import '../l10n/app_localizations.dart'; // Import AppLocalizations

class DiscoverRecipesScreen extends StatefulWidget {
  const DiscoverRecipesScreen({Key? key}) : super(key: key);

  @override
  _DiscoverRecipesScreenState createState() => _DiscoverRecipesScreenState();
}

class _DiscoverRecipesScreenState extends State<DiscoverRecipesScreen> {
  final RecipeService _recipeService = RecipeService();
  late Future<List<Recipe>> _recipesFuture;

  List<Recipe> _allRecipes = [];
  List<Recipe> _filteredRecipes = [];

  // State variables for filters and sorting
  String _searchTerm = '';
  double? _maxCost;
  List<String> _selectedDietaryFilters = [];
  String _sortBy = 'name'; // Default sort: name, cost, time
  bool _sortAscending = true;

  final List<String> _dietaryOptions = const [
    'High-Protein', 'Low-Carbohydrate', 'Vegetarian', 'Vegan', 'Gluten-Free',
    // 'Quick', 'Budget-Friendly' // These might need specific backend fields or logic
  ];

  // NOTE: The visual labels for these dietary options are localized via
  // AppLocalizations. The list above contains the internal values that may
  // match backend tags (kept for filtering logic). The old hardcoded display
  // strings are preserved above; localization getters are used when showing
  // labels to the user.

  @override
  void initState() {
    super.initState();
    _loadRecipes();
  }

  void _loadRecipes() {
    _recipesFuture = _recipeService.getAllRecipes();
    _recipesFuture
        .then((recipes) {
          if (mounted) {
            // Check if the widget is still in the tree
            setState(() {
              _allRecipes = recipes;
              _filteredRecipes = recipes; // Initially, display all recipes
            });
          }
        })
        .catchError((error) {
          if (mounted) {
            // Handle error state, maybe show a snackbar or a message on screen
            print("Error loading recipes: $error");
            // Optionally set _filteredRecipes to empty or show an error widget
            setState(() {
              _filteredRecipes = [];
            });
          }
        });
  }

  void _applyFiltersAndSort() {
    List<Recipe> tempRecipes = List.from(_allRecipes);

    // Apply search term
    if (_searchTerm.isNotEmpty) {
      tempRecipes =
          tempRecipes
              .where(
                (recipe) => recipe.name.toLowerCase().contains(
                  _searchTerm.toLowerCase(),
                ),
              )
              .toList();
    }

    // Apply max cost
    if (_maxCost != null) {
      tempRecipes =
          tempRecipes
              .where(
                (recipe) =>
                    (recipe.costPerServing ?? double.infinity) <= _maxCost!,
              )
              .toList();
    }

    // Apply dietary filters
    if (_selectedDietaryFilters.isNotEmpty) {
      tempRecipes =
          tempRecipes.where((recipe) {
            final recipeDietaryInfoLower =
                recipe.dietaryInfo.map((e) => e.toLowerCase()).toList();
            return _selectedDietaryFilters.every(
              (filter) => recipeDietaryInfoLower.contains(filter.toLowerCase()),
            );
          }).toList();
    }

    // Apply sorting
    tempRecipes.sort((a, b) {
      int comparison;
      switch (_sortBy) {
        case 'cost':
          comparison = (a.costPerServing ?? double.infinity).compareTo(
            b.costPerServing ?? double.infinity,
          );
          break;
        case 'time':
          comparison = a.totalTime.compareTo(b.totalTime);
          break;
        case 'name':
        default:
          comparison = a.name.toLowerCase().compareTo(b.name.toLowerCase());
          break;
      }
      return _sortAscending ? comparison : -comparison;
    });

    if (mounted) {
      setState(() {
        _filteredRecipes = tempRecipes;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.discoverRecipesTitle),
        // TODO: Add filter/sort actions
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              // Wrap in a Column to add more filter controls
              children: [
                TextField(
                  decoration: InputDecoration(
                    labelText: AppLocalizations.of(context)!.searchRecipes,
                    border: OutlineInputBorder(),
                    suffixIcon: Icon(Icons.search),
                  ),
                  onChanged: (value) {
                    if (mounted) {
                      setState(() {
                        _searchTerm = value;
                        _applyFiltersAndSort();
                      });
                    }
                  },
                ),
                const SizedBox(height: 8), // Spacing
                TextField(
                  decoration: InputDecoration(
                    labelText: AppLocalizations.of(context)!.maxCost,
                    border: OutlineInputBorder(),
                    suffixIcon: Icon(Icons.attach_money),
                  ),
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  onChanged: (value) {
                    if (mounted) {
                      setState(() {
                        _maxCost = double.tryParse(value);
                        _applyFiltersAndSort();
                      });
                    }
                  },
                ),
                const SizedBox(height: 8),
                Text(
                  AppLocalizations.of(context)!.dietaryOptions,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                Wrap(
                  spacing: 8.0,
                
                  children: _dietaryOptions.map((optionValue) {
                    // optionValue is the internal tag (e.g. 'High-Protein').
                    // We map it to a localized display label when rendering.
                    final bool isSelected = _selectedDietaryFilters
                        .contains(optionValue);

                    String _localizedLabel() {
                      final loc = AppLocalizations.of(context)!;
                      switch (optionValue) {
                        case 'High-Protein':
                          return loc.dietaryHighProtein;
                        case 'Low-Carbohydrate':
                          return loc.dietaryLowCarbohydrate;
                        case 'Vegetarian':
                          return loc.dietaryVegetarian;
                        case 'Vegan':
                          return loc.dietaryVegan;
                        case 'Gluten-Free':
                          return loc.dietaryGlutenFree;
                        default:
                          return optionValue;
                      }
                    }

                    return ChoiceChip(
                      label: Text(
                        _localizedLabel(),
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.black,
                        ),
                      ),
                      selected: isSelected,
                      selectedColor: AppTheme.primaryGreen,
                      backgroundColor: AppTheme.backgroundGrey,
                      onSelected: (selected) {
                        if (mounted) {
                          setState(() {
                            if (selected) {
                              _selectedDietaryFilters.add(optionValue);
                            } else {
                              _selectedDietaryFilters.remove(optionValue);
                            }
                            _applyFiltersAndSort();
                          });
                        }
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      AppLocalizations.of(context)!.sortBy,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                    
                    DropdownButton<String>(
                      value: _sortBy,
                      style: TextStyle(color: AppTheme.primaryGreen),
                      dropdownColor: AppTheme.backgroundGrey,
                      items: <String>['name', 'cost', 'time']
                          .map<DropdownMenuItem<String>>((String value) {
                        String label;
                        final loc = AppLocalizations.of(context)!;
                        switch (value) {
                          case 'cost':
                            label = loc.sortCost;
                            break;
                          case 'time':
                            label = loc.sortTime;
                            break;
                          case 'name':
                          default:
                            label = loc.sortName;
                            break;
                        }
                        return DropdownMenuItem<String>(
                          value: value,
                          child: Text(
                            label,
                            style: TextStyle(color: Colors.black),
                          ),
                        );
                      }).toList(),
                      onChanged: (String? newValue) {
                        if (mounted && newValue != null) {
                          setState(() {
                            _sortBy = newValue;
                            _applyFiltersAndSort();
                          });
                        }
                      },
                    ),
                    IconButton(
                      icon: Icon(
                        _sortAscending
                            ? Icons.arrow_upward
                            : Icons.arrow_downward,
                        color: AppTheme.primaryGreen, // Icon color
                      ),
                      onPressed: () {
                        if (mounted) {
                          setState(() {
                            _sortAscending = !_sortAscending;
                            _applyFiltersAndSort();
                          });
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Recipe>>(
              future: _recipesFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                } else if (snapshot.hasError) {
                  return Center(child: Text(AppLocalizations.of(context)!.errorLoadingRecipes(snapshot.error ?? '')));
                } else if (snapshot.hasData && snapshot.data!.isEmpty) {
                  return Center(child: Text(AppLocalizations.of(context)!.noRecipesFound));
                } else if (snapshot.hasData) {
                  if (_filteredRecipes.isEmpty && _allRecipes.isNotEmpty) {
                    return Center(
                      child: Text(AppLocalizations.of(context)!.noRecipesMatchFilters),
                    );
                  }
                  return ListView.builder(
                    itemCount: _filteredRecipes.length,
                    itemBuilder: (context, index) {
                      final recipe = _filteredRecipes[index];
                      return RecipeCard(
                        recipe: recipe,
                        creatorUsername: recipe.creatorUsername,
                      );
                    },
                  );
                } else {
                  return Center(child: Text(AppLocalizations.of(context)!.noRecipesAvailable));
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}

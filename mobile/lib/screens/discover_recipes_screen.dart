import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/currency_provider.dart';
import '../models/recipe.dart';
import '../models/user_profile.dart';
import '../services/recipe_service.dart';
import '../widgets/recipe_card.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';

class DiscoverRecipesScreen extends StatefulWidget {
  final RecipeService? recipeService;

  const DiscoverRecipesScreen({Key? key, this.recipeService}) : super(key: key);

  @override
  _DiscoverRecipesScreenState createState() => _DiscoverRecipesScreenState();
}

class _DiscoverRecipesScreenState extends State<DiscoverRecipesScreen> {
  late final RecipeService _recipeService;
  final ScrollController _scrollController = ScrollController();

  // TextEditingControllers for filter inputs
  final TextEditingController _maxCostController = TextEditingController();
  final TextEditingController _maxTotalTimeController = TextEditingController();
  final TextEditingController _maxCaloriesController = TextEditingController();
  final TextEditingController _maxProteinController = TextEditingController();
  final TextEditingController _maxCarbsController = TextEditingController();
  final TextEditingController _maxFatController = TextEditingController();
  final TextEditingController _excludeAllergensController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();
  Timer? _searchDebounce;

  List<Recipe> _recipes = [];

  // Pagination state
  int _currentPage = 1;
  bool _isLoadingMore = false;
  bool _hasMorePages = true;
  bool _isInitialLoading = true;

  // Filter state variables
  String _searchTerm = '';
  String? _selectedMealType;
  double? _maxCost;
  int? _maxTotalTime;
  double? _maxCalories;
  double? _maxProtein;
  double? _maxCarbs;
  double? _maxFat;
  String _excludeAllergens = '';
  bool _showOnlyWithImage = false;
  
  // Track currency to reset filter on change
  Currency? _lastCurrency;



  @override
  void initState() {
    super.initState();
    _recipeService = widget.recipeService ?? RecipeService();
    _loadRecipes();
    _scrollController.addListener(_onScroll);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final currency = Provider.of<CurrencyProvider>(context).currency;
    if (_lastCurrency != null && _lastCurrency != currency) {
      // Currency changed, reset cost filter
      _maxCost = null;
      _maxCostController.clear();
      // We don't need to call setState here as didChangeDependencies is called before build
      // but we should trigger a reload if needed
      _loadRecipes(reset: true);
    }
    _lastCurrency = currency;
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _maxCostController.dispose();
    _maxTotalTimeController.dispose();
    _maxCaloriesController.dispose();
    _maxProteinController.dispose();
    _maxCarbsController.dispose();
    _maxFatController.dispose();
    _excludeAllergensController.dispose();
    _searchController.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent * 0.8) {
      if (!_isLoadingMore && _hasMorePages) {
        _loadMoreRecipes();
      }
    }
  }

  Future<void> _loadRecipes({bool reset = false}) async {
    if (reset) {
      setState(() {
        _currentPage = 1;
        _hasMorePages = true;
        _isInitialLoading = true;
        _recipes = [];
      });
    }

    try {
      final paginatedRecipes = await _recipeService.getFilteredRecipes(
        page: _currentPage,
        pageSize: 10,
        name: _searchTerm.isEmpty ? null : _searchTerm,
        mealType: _selectedMealType,
        maxCostPerServing: _maxCost,
        maxTotalTime: _maxTotalTime,
        maxCalories: _maxCalories,
        maxProtein: _maxProtein,
        maxCarbs: _maxCarbs,
        maxFat: _maxFat,
        excludeAllergens: _excludeAllergens.isEmpty ? null : _excludeAllergens,
        hasImage: _showOnlyWithImage ? true : null,
      );

      if (mounted) {
        setState(() {
          _currentPage = paginatedRecipes.page;
          _recipes = paginatedRecipes.results;
          _hasMorePages = paginatedRecipes.hasMorePages;
          _isInitialLoading = false;
        });
      }
    } catch (error) {
      if (mounted) {
        print("Error loading recipes: $error");
        setState(() {
          _isInitialLoading = false;
          _recipes = [];
        });
      }
    }
  }

  Future<void> _loadMoreRecipes() async {
    if (_isLoadingMore || !_hasMorePages) return;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final nextPage = _currentPage + 1;
      final paginatedRecipes = await _recipeService.getFilteredRecipes(
        page: nextPage,
        pageSize: 10,
        name: _searchTerm.isEmpty ? null : _searchTerm,
        mealType: _selectedMealType,
        maxCostPerServing: _maxCost,
        maxTotalTime: _maxTotalTime,
        maxCalories: _maxCalories,
        maxProtein: _maxProtein,
        maxCarbs: _maxCarbs,
        maxFat: _maxFat,
        excludeAllergens: _excludeAllergens.isEmpty ? null : _excludeAllergens,
        hasImage: _showOnlyWithImage ? true : null,
      );

      if (mounted) {
        setState(() {
          _currentPage = paginatedRecipes.page;
          _recipes.addAll(paginatedRecipes.results);
          _hasMorePages = paginatedRecipes.hasMorePages;
          _isLoadingMore = false;
        });
      }
    } catch (error) {
      if (mounted) {
        print("Error loading more recipes: $error");
        setState(() {
          _isLoadingMore = false;
        });
      }
    }
  }

  void _handleSearchChanged(String value) {
    setState(() {
      _searchTerm = value;
    });
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), () {
      if (_searchTerm == value) {
        _onFilterChanged();
      }
    });
  }

  void _clearSearch({bool shouldReload = true}) {
    _searchDebounce?.cancel();
    if (_searchController.text.isNotEmpty) {
      _searchController.clear();
    }
    setState(() {
      _searchTerm = '';
    });
    if (shouldReload) {
      _onFilterChanged();
    }
  }

  void _clearFilterControllers() {
    _maxCostController.clear();
    _maxTotalTimeController.clear();
    _maxCaloriesController.clear();
    _maxProteinController.clear();
    _maxCarbsController.clear();
    _maxFatController.clear();
    _excludeAllergensController.clear();
  }

  void _resetFilters({bool shouldReload = true}) {
    setState(() {
      _selectedMealType = null;
      _maxCost = null;
      _maxTotalTime = null;
      _maxCalories = null;
      _maxProtein = null;
      _maxCarbs = null;
      _maxFat = null;
      _excludeAllergens = '';
      _showOnlyWithImage = false;
    });
    _clearFilterControllers();
    if (shouldReload) {
      _onFilterChanged();
    }
  }

  String _mealTypeName(String value, AppLocalizations loc) {
    switch (value) {
      case 'breakfast':
        return loc.breakfast;
      case 'lunch':
        return loc.lunch;
      case 'dinner':
        return loc.dinner;
      default:
        return value;
    }
  }

  String _stripExampleText(String text) {
    final index = text.indexOf('(');
    if (index == -1) return text;
    return text.substring(0, index).trim();
  }

  String _formatNumber(num value) {
    if (value % 1 == 0) {
      return value.toInt().toString();
    }
    return value.toStringAsFixed(1);
  }

  List<_ActiveFilterTag> _buildActiveFilterTags(AppLocalizations loc) {
    final currencySymbol = Provider.of<CurrencyProvider>(context).symbol;
    final tags = <_ActiveFilterTag>[];

    if (_searchTerm.isNotEmpty) {
      tags.add(
        _ActiveFilterTag(
          label: '${loc.searchRecipes}: \"$_searchTerm\"',
          onRemove: () => _clearSearch(),
        ),
      );
    }

    if (_selectedMealType != null) {
      tags.add(
        _ActiveFilterTag(
          label: '${loc.mealTypeLabel}: ${_mealTypeName(_selectedMealType!, loc)}',
          onRemove: () {
            setState(() => _selectedMealType = null);
            _onFilterChanged();
          },
        ),
      );
    }

    if (_maxCost != null) {
      tags.add(
        _ActiveFilterTag(
          label: '${_stripExampleText(loc.maxCost)} ≤ $currencySymbol${_formatNumber(_maxCost!)}',
          onRemove: () {
            setState(() => _maxCost = null);
            _maxCostController.clear();
            _onFilterChanged();
          },
        ),
      );
    }

    if (_maxTotalTime != null) {
      tags.add(
        _ActiveFilterTag(
          label: '${loc.totalTimeFilter}: ≤ ${_maxTotalTime!} ${loc.minutesAbbr}',
          onRemove: () {
            setState(() => _maxTotalTime = null);
            _maxTotalTimeController.clear();
            _onFilterChanged();
          },
        ),
      );
    }

    if (_maxCalories != null) {
      tags.add(
        _ActiveFilterTag(
          label: '${loc.calories}: ≤ ${_formatNumber(_maxCalories!)} ${loc.kcal}',
          onRemove: () {
            setState(() => _maxCalories = null);
            _maxCaloriesController.clear();
            _onFilterChanged();
          },
        ),
      );
    }

    if (_maxProtein != null) {
      tags.add(
        _ActiveFilterTag(
          label: '${loc.protein}: ≤ ${_formatNumber(_maxProtein!)} ${loc.grams}',
          onRemove: () {
            setState(() => _maxProtein = null);
            _maxProteinController.clear();
            _onFilterChanged();
          },
        ),
      );
    }

    if (_maxCarbs != null) {
      tags.add(
        _ActiveFilterTag(
          label: '${loc.carbs}: ≤ ${_formatNumber(_maxCarbs!)} ${loc.grams}',
          onRemove: () {
            setState(() => _maxCarbs = null);
            _maxCarbsController.clear();
            _onFilterChanged();
          },
        ),
      );
    }

    if (_maxFat != null) {
      tags.add(
        _ActiveFilterTag(
          label: '${loc.fat}: ≤ ${_formatNumber(_maxFat!)} ${loc.grams}',
          onRemove: () {
            setState(() => _maxFat = null);
            _maxFatController.clear();
            _onFilterChanged();
          },
        ),
      );
    }

    if (_excludeAllergens.isNotEmpty) {
      tags.add(
        _ActiveFilterTag(
          label: '${loc.allergensLabel}: $_excludeAllergens',
          onRemove: () {
            setState(() => _excludeAllergens = '');
            _excludeAllergensController.clear();
            _onFilterChanged();
          },
        ),
      );
    }

    if (_showOnlyWithImage) {
      tags.add(
        _ActiveFilterTag(
          label: loc.hasImageFilter,
          onRemove: () {
            setState(() => _showOnlyWithImage = false);
            _onFilterChanged();
          },
        ),
      );
    }

    return tags;
  }

  Widget _buildActiveFiltersCard(AppLocalizations loc, List<_ActiveFilterTag> tags) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${loc.filters} (${tags.length})',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              TextButton(
                onPressed: () {
                  _clearSearch(shouldReload: false);
                  _resetFilters(shouldReload: false);
                  _onFilterChanged();
                },
                child: Text(loc.clearAll),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: tags
                .map(
                  (tag) => InputChip(
                    label: Text(tag.label),
                    onPressed: tag.onRemove,
                    onDeleted: tag.onRemove,
                    deleteIcon: const Icon(Icons.close, size: 16),
                    backgroundColor: AppTheme.primaryGreen.withOpacity(0.08),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(color: AppTheme.primaryGreen.withOpacity(0.2)),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterCard({
    required IconData icon,
    required String title,
    String? description,
    required Widget child,
    Key? titleKey,
    Key? cardKey,
  }) {
    return Container(
      key: cardKey,
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 34,
                width: 34,
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: AppTheme.primaryGreen, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      key: titleKey,
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    if (description != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        description,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.textSecondary),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  void _onFilterChanged() {
    // Reset pagination and reload with new filters
    _loadRecipes(reset: true);
  }

  void _showFiltersDialog() {
    final loc = AppLocalizations.of(context)!;
    // Initialize controllers with current filter values
    _maxCostController.text = _maxCost?.toString() ?? '';
    _maxTotalTimeController.text = _maxTotalTime?.toString() ?? '';
    _maxCaloriesController.text = _maxCalories?.toString() ?? '';
    _maxProteinController.text = _maxProtein?.toString() ?? '';
    _maxCarbsController.text = _maxCarbs?.toString() ?? '';
    _maxFatController.text = _maxFat?.toString() ?? '';
    _excludeAllergensController.text = _excludeAllergens;
    FocusScope.of(context).unfocus();
  
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return DraggableScrollableSheet(
              initialChildSize: 0.9,
              minChildSize: 0.5,
              maxChildSize: 0.95,
              builder: (context, scrollController) {
                return Container(
                  decoration: const BoxDecoration(
                    color: AppTheme.backgroundGrey,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                  ),
                  child: Column(
                    children: [
                      // Drag Handle
                      Center(
                        child: Container(
                          margin: const EdgeInsets.only(top: 12, bottom: 8),
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: Colors.grey[400],
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      
                      // Header
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              loc.filters,
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textOnLight,
                              ),
                            ),
                            TextButton(
                              onPressed: () {
                                _resetFilters(shouldReload: false);
                                setModalState(() {});
                                _onFilterChanged();
                              },
                              child: Text(loc.resetFilters),
                            ),
                          ],
                        ),
                      ),
                      
                      const Divider(height: 1),

                      // Scrollable Content
                      Expanded(
                        child: ListView(
                          controller: scrollController,
                          padding: const EdgeInsets.fromLTRB(24, 24, 24, 140),
                          children: [
                            _buildFilterCard(
                              icon: Icons.restaurant_menu_outlined,
                              title: loc.mealTypeLabel,
                              child: Wrap(
                                spacing: 10,
                                runSpacing: 10,
                                children: [
                                  _buildMealTypeChip(loc.breakfast, 'breakfast', Icons.wb_sunny_outlined, onStateUpdated: () => setModalState(() {})),
                                  _buildMealTypeChip(loc.lunch, 'lunch', Icons.restaurant_outlined, onStateUpdated: () => setModalState(() {})),
                                  _buildMealTypeChip(loc.dinner, 'dinner', Icons.nights_stay_outlined, onStateUpdated: () => setModalState(() {})),
                                ],
                              ),
                            ),
                            _buildFilterCard(
                              icon: Icons.payments_outlined,
                              title: _stripExampleText(loc.maxCost),
                              child: _buildQuickSelectInput(
                                context,
                                title: loc.maxCost,
                                controller: _maxCostController,
                                presets: [50, 100, 200, 500],
                                unit: Provider.of<CurrencyProvider>(context).symbol,
                                currentValue: _maxCost,
                                showTitle: false,
                                onChanged: (value) {
                                  setModalState(() => _maxCost = value);
                                  setState(() => _maxCost = value);
                                },
                              ),
                            ),
                            _buildFilterCard(
                              icon: Icons.schedule_outlined,
                              title: loc.totalTimeFilter,
                              child: _buildQuickSelectInput(
                                context,
                                title: loc.totalTimeFilter,
                                controller: _maxTotalTimeController,
                                presets: [15, 30, 45, 60],
                                unit: ' ${loc.minutesAbbr}',
                                currentValue: _maxTotalTime?.toDouble(),
                                isInteger: true,
                                showTitle: false,
                                onChanged: (value) {
                                  final time = value?.toInt();
                                  setModalState(() => _maxTotalTime = time);
                                  setState(() => _maxTotalTime = time);
                                },
                              ),
                            ),
                            _buildFilterCard(
                              icon: Icons.local_fire_department_outlined,
                              title: loc.nutritionFacts,
                              child: Column(
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _buildNutritionInput(
                                          context,
                                          loc.calories,
                                          loc.kcal,
                                          _maxCaloriesController,
                                          (val) {
                                            setModalState(() => _maxCalories = val);
                                            setState(() => _maxCalories = val);
                                          },
                                          fieldKey: const Key('discoverCaloriesField'),
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: _buildNutritionInput(context, loc.protein, loc.grams, _maxProteinController, (val) {
                                          setModalState(() => _maxProtein = val);
                                          setState(() => _maxProtein = val);
                                        }),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _buildNutritionInput(context, loc.carbs, loc.grams, _maxCarbsController, (val) {
                                          setModalState(() => _maxCarbs = val);
                                          setState(() => _maxCarbs = val);
                                        }),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: _buildNutritionInput(context, loc.fat, loc.grams, _maxFatController, (val) {
                                          setModalState(() => _maxFat = val);
                                          setState(() => _maxFat = val);
                                        }),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            _buildFilterCard(
                              icon: Icons.warning_amber_rounded,
                              title: loc.allergensLabel,
                              child: TextField(
                                controller: _excludeAllergensController,
                                decoration: InputDecoration(
                                  hintText: loc.allergensLabel,
                                  prefixIcon: const Icon(Icons.warning_amber_rounded),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                  filled: true,
                                  fillColor: AppTheme.backgroundGrey,
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                ),
                                onChanged: (value) {
                                  setModalState(() => _excludeAllergens = value);
                                  setState(() => _excludeAllergens = value);
                                },
                              ),
                            ),
                            _buildFilterCard(
                              icon: Icons.tune,
                              title: loc.preferences,
                              titleKey: const Key('discoverPreferencesTitle'),
                              cardKey: const Key('discoverPreferencesCard'),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: AppTheme.backgroundGrey,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: SwitchListTile(
                                  key: const Key('discoverHasImageSwitch'),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                                  title: Text(loc.hasImageFilter, style: const TextStyle(fontWeight: FontWeight.w500)),
                                  value: _showOnlyWithImage,
                                  activeColor: AppTheme.primaryGreen,
                                  activeTrackColor: AppTheme.primaryGreen.withOpacity(0.2),
                                  onChanged: (value) {
                                    setModalState(() => _showOnlyWithImage = value);
                                    setState(() => _showOnlyWithImage = value);
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      // Sticky Apply Button
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, -5),
                            ),
                          ],
                        ),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context);
                              _onFilterChanged();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryGreen,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 0,
                            ),
                            child: Text(
                              loc.applyFilters,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    ).whenComplete(() {
      // Ensure state is synced if needed when modal closes
    });
  }

  Widget _buildMealTypeChip(String label, String value, IconData icon, {VoidCallback? onStateUpdated}) {
    final isSelected = _selectedMealType == value;
    return FilterChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: isSelected ? Colors.white : AppTheme.primaryGreen),
          const SizedBox(width: 8),
          Text(label),
        ],
      ),
      selected: isSelected,
      onSelected: (bool selected) {
        setState(() {
          _selectedMealType = selected ? value : null;
        });
        onStateUpdated?.call();
      },
      backgroundColor: Colors.white,
      selectedColor: AppTheme.primaryGreen,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppTheme.textOnLight,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: isSelected ? Colors.transparent : Colors.grey[300]!),
      ),
      showCheckmark: false,
    );
  }



  Widget _buildQuickSelectInput(
    BuildContext context, {
    required String title,
    required TextEditingController controller,
    required List<num> presets,
    required String unit,
    required double? currentValue,
    required ValueChanged<double?> onChanged,
    bool isInteger = false,
    bool showTitle = true,
  }) {
    final loc = AppLocalizations.of(context)!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (showTitle)
          Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        if (showTitle)
          const SizedBox(height: 12)
        else
          const SizedBox(height: 4),
        
        // Quick Select Chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: presets.map((preset) {
              final isSelected = currentValue == preset.toDouble();
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ActionChip(
                  label: Text(
                    '${isInteger ? preset.toInt() : preset}$unit',
                    style: TextStyle(
                      color: isSelected ? Colors.white : AppTheme.textOnLight,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  backgroundColor: isSelected ? AppTheme.primaryGreen : Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(
                      color: isSelected ? Colors.transparent : Colors.grey[300]!,
                    ),
                  ),
                  onPressed: () {
                    final newValue = isSelected ? null : preset.toDouble();
                    controller.text = newValue != null 
                        ? (isInteger ? newValue.toInt().toString() : newValue.toString()) 
                        : '';
                    onChanged(newValue);
                  },
                ),
              );
            }).toList(),
          ),
        ),
        
        const SizedBox(height: 12),
        
        // Manual Input
        TextField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d*')),
          ],
          decoration: InputDecoration(
            hintText: loc.enterValidNumber,
            suffixText: unit,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            suffixIcon: controller.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, size: 20),
                    onPressed: () {
                      controller.clear();
                      onChanged(null);
                    },
                  )
                : null,
          ),
          onChanged: (value) {
            final numValue = double.tryParse(value);
            onChanged(numValue);
          },
        ),
      ],
    );
  }

  Widget _buildNutritionInput(
    BuildContext context, 
    String label, 
    String suffix, 
    TextEditingController controller,
    ValueChanged<double?> onChanged, {
    Key? fieldKey,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        TextField(
          key: fieldKey,
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d*')),
          ],
          decoration: InputDecoration(
            hintText: '-',
            suffixText: suffix,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Colors.white,
            isDense: true,
            suffixIcon: controller.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, size: 16),
                    onPressed: () {
                      controller.clear();
                      onChanged(null);
                    },
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  )
                : null,
          ),
          onChanged: (value) => onChanged(double.tryParse(value)),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context)!;
    final activeFilterTags = _buildActiveFilterTags(loc);
    final activeFilterCount = activeFilterTags.length;

    return Scaffold(
      appBar: AppBar(
        title: Text(loc.discoverRecipesTitle),
        actions: [
          IconButton(
            tooltip: activeFilterCount > 0 ? '${loc.filters} ($activeFilterCount)' : loc.filters,
            onPressed: () {
              FocusScope.of(context).unfocus();
              _showFiltersDialog();
            },
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.filter_list),
                if (activeFilterCount > 0)
                  Positioned(
                    right: -2,
                    top: -2,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryGreen,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                      child: Center(
                        child: Text(
                          '$activeFilterCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: AppTheme.backgroundGrey,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _searchController,
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: loc.searchRecipes,
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => _clearSearch(),
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: _handleSearchChanged,
                  onSubmitted: (value) {
                    _searchDebounce?.cancel();
                    setState(() {
                      _searchTerm = value;
                    });
                    FocusScope.of(context).unfocus();
                    _onFilterChanged();
                  },
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    key: const Key('discoverFiltersButton'),
                    icon: const Icon(Icons.tune_rounded),
                    label: Text(
                      activeFilterCount > 0 ? '${loc.filters} ($activeFilterCount)' : loc.filters,
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      side: BorderSide(color: AppTheme.primaryGreen.withOpacity(0.6)),
                      foregroundColor: AppTheme.primaryGreen,
                    ),
                    onPressed: () {
                      FocusScope.of(context).unfocus();
                      _showFiltersDialog();
                    },
                  ),
                ),
                if (activeFilterTags.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: _buildActiveFiltersCard(loc, activeFilterTags),
                  ),
              ],
            ),
          ),
          Expanded(
            child: _isInitialLoading
                ? const Center(child: CircularProgressIndicator())
                : _recipes.isEmpty
                    ? Center(child: Text(loc.noRecipesFound))
                    : ListView.builder(
                        controller: _scrollController,
                        itemCount: _recipes.length + (_isLoadingMore ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index == _recipes.length) {
                            return const Padding(
                              padding: EdgeInsets.all(16.0),
                              child: Center(child: CircularProgressIndicator()),
                            );
                          }

                          final recipe = _recipes[index];
                          return RecipeCard(
                            recipe: recipe,
                            creatorUsername: recipe.creatorUsername,
                            onRefresh: () => _loadRecipes(reset: true),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _ActiveFilterTag {
  final String label;
  final VoidCallback onRemove;

  const _ActiveFilterTag({
    required this.label,
    required this.onRemove,
  });
}

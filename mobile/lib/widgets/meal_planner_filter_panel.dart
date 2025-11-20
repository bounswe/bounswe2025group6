import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';
import '../utils/unit_translator.dart';
import '../providers/currency_provider.dart';

class MealPlannerFilterPanel extends StatefulWidget {
  final Map<String, dynamic> initialFilters;
  final String? selectedMealType;
  final Function(Map<String, dynamic>, String?) onApplyFilters;
  final VoidCallback onResetFilters;

  const MealPlannerFilterPanel({
    Key? key,
    required this.initialFilters,
    this.selectedMealType,
    required this.onApplyFilters,
    required this.onResetFilters,
  }) : super(key: key);

  @override
  State<MealPlannerFilterPanel> createState() => _MealPlannerFilterPanelState();
}

class _MealPlannerFilterPanelState extends State<MealPlannerFilterPanel> {
  late Map<String, dynamic> _filters;
  String? _selectedMealType;

  // Key to force rebuild of form when resetting
  Key _formKey = UniqueKey();

  // Budget filters
  double? _minCost;
  double? _maxCost;

  // Nutrition filters
  double? _minCalories;
  double? _maxCalories;
  double? _minProtein;
  double? _maxProtein;
  double? _minCarbs;
  double? _maxCarbs;
  double? _minFat;
  double? _maxFat;

  // Time filters
  int? _minTotalTime;
  int? _maxTotalTime;

  // Rating filters
  double? _minDifficultyRating;
  double? _maxDifficultyRating;
  double? _minTasteRating;
  double? _maxTasteRating;
  double? _minHealthRating;
  double? _maxHealthRating;

  // Boolean filters
  bool? _hasImage;
  bool? _approvedOnly;
  bool? _featuredOnly;

  @override
  void initState() {
    super.initState();
    _filters = Map.from(widget.initialFilters);
    _selectedMealType = widget.selectedMealType;
    _loadFiltersFromMap();
  }

  void _loadFiltersFromMap() {
    _minCost = _filters['minCostPerServing'];
    _maxCost = _filters['maxCostPerServing'];
    _minCalories = _filters['minCalories'];
    _maxCalories = _filters['maxCalories'];
    _minProtein = _filters['minProtein'];
    _maxProtein = _filters['maxProtein'];
    _minCarbs = _filters['minCarbs'];
    _maxCarbs = _filters['maxCarbs'];
    _minFat = _filters['minFat'];
    _maxFat = _filters['maxFat'];
    _minTotalTime = _filters['minTotalTime'];
    _maxTotalTime = _filters['maxTotalTime'];
    _minDifficultyRating = _filters['minDifficultyRating'];
    _maxDifficultyRating = _filters['maxDifficultyRating'];
    _minTasteRating = _filters['minTasteRating'];
    _maxTasteRating = _filters['maxTasteRating'];
    _minHealthRating = _filters['minHealthRating'];
    _maxHealthRating = _filters['maxHealthRating'];
    _hasImage = _filters['hasImage'];
    _approvedOnly = _filters['approvedOnly'];
    _featuredOnly = _filters['featuredOnly'];
  }

  void _saveFiltersToMap() {
    _filters = {
      if (_minCost != null) 'minCostPerServing': _minCost,
      if (_maxCost != null) 'maxCostPerServing': _maxCost,
      if (_minCalories != null) 'minCalories': _minCalories,
      if (_maxCalories != null) 'maxCalories': _maxCalories,
      if (_minProtein != null) 'minProtein': _minProtein,
      if (_maxProtein != null) 'maxProtein': _maxProtein,
      if (_minCarbs != null) 'minCarbs': _minCarbs,
      if (_maxCarbs != null) 'maxCarbs': _maxCarbs,
      if (_minFat != null) 'minFat': _minFat,
      if (_maxFat != null) 'maxFat': _maxFat,
      if (_minTotalTime != null) 'minTotalTime': _minTotalTime,
      if (_maxTotalTime != null) 'maxTotalTime': _maxTotalTime,
      if (_minDifficultyRating != null)
        'minDifficultyRating': _minDifficultyRating,
      if (_maxDifficultyRating != null)
        'maxDifficultyRating': _maxDifficultyRating,
      if (_minTasteRating != null) 'minTasteRating': _minTasteRating,
      if (_maxTasteRating != null) 'maxTasteRating': _maxTasteRating,
      if (_minHealthRating != null) 'minHealthRating': _minHealthRating,
      if (_maxHealthRating != null) 'maxHealthRating': _maxHealthRating,
      if (_hasImage != null) 'hasImage': _hasImage,
      if (_approvedOnly != null) 'approvedOnly': _approvedOnly,
      if (_featuredOnly != null) 'featuredOnly': _featuredOnly,
    };
  }

  void _resetFilters() {
    setState(() {
      _minCost = null;
      _maxCost = null;
      _minCalories = null;
      _maxCalories = null;
      _minProtein = null;
      _maxProtein = null;
      _minCarbs = null;
      _maxCarbs = null;
      _minFat = null;
      _maxFat = null;
      _minTotalTime = null;
      _maxTotalTime = null;
      _minDifficultyRating = null;
      _maxDifficultyRating = null;
      _minTasteRating = null;
      _maxTasteRating = null;
      _minHealthRating = null;
      _maxHealthRating = null;
      _hasImage = null;
      _approvedOnly = null;
      _featuredOnly = null;
      _selectedMealType = null;
      _filters.clear();

      // Force rebuild of form to clear all text fields
      _formKey = UniqueKey();
    });
    widget.onResetFilters();
  }

  bool _validateFilters() {
    // Validate min/max relationships
    if (_minCost != null && _maxCost != null && _minCost! > _maxCost!) {
      return false;
    }
    if (_minCalories != null &&
        _maxCalories != null &&
        _minCalories! > _maxCalories!) {
      return false;
    }
    if (_minProtein != null &&
        _maxProtein != null &&
        _minProtein! > _maxProtein!) {
      return false;
    }
    if (_minCarbs != null && _maxCarbs != null && _minCarbs! > _maxCarbs!) {
      return false;
    }
    if (_minFat != null && _maxFat != null && _minFat! > _maxFat!) {
      return false;
    }
    if (_minTotalTime != null &&
        _maxTotalTime != null &&
        _minTotalTime! > _maxTotalTime!) {
      return false;
    }
    if (_minDifficultyRating != null &&
        _maxDifficultyRating != null &&
        _minDifficultyRating! > _maxDifficultyRating!) {
      return false;
    }
    if (_minTasteRating != null &&
        _maxTasteRating != null &&
        _minTasteRating! > _maxTasteRating!) {
      return false;
    }
    if (_minHealthRating != null &&
        _maxHealthRating != null &&
        _minHealthRating! > _maxHealthRating!) {
      return false;
    }

    // Validate positive numbers
    if (_minCost != null && _minCost! < 0) return false;
    if (_maxCost != null && _maxCost! < 0) return false;
    if (_minCalories != null && _minCalories! < 0) return false;
    if (_maxCalories != null && _maxCalories! < 0) return false;
    if (_minProtein != null && _minProtein! < 0) return false;
    if (_maxProtein != null && _maxProtein! < 0) return false;
    if (_minCarbs != null && _minCarbs! < 0) return false;
    if (_maxCarbs != null && _maxCarbs! < 0) return false;
    if (_minFat != null && _minFat! < 0) return false;
    if (_maxFat != null && _maxFat! < 0) return false;
    if (_minTotalTime != null && _minTotalTime! < 0) return false;
    if (_maxTotalTime != null && _maxTotalTime! < 0) return false;

    return true;
  }

  void _applyFilters() {
    if (!_validateFilters()) {
      final localizations = AppLocalizations.of(context)!;

      // Show alert dialog which will appear above the modal
      showDialog(
        context: context,
        builder:
            (context) => AlertDialog(
              title: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppTheme.errorColor),
                  const SizedBox(width: 8),
                  Text(localizations.validationError),
                ],
              ),
              content: Text(
                '${localizations.fixValidationErrors}\n\n${localizations.validationCheckList}',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(localizations.ok),
                ),
              ],
            ),
      );
      return;
    }

    _saveFiltersToMap();
    widget.onApplyFilters(_filters, _selectedMealType);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final localizations = AppLocalizations.of(context)!;
    final currencyProvider = Provider.of<CurrencyProvider>(context);

    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      localizations.filters,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(
                      onPressed: _resetFilters,
                      child: Text(localizations.resetFilters),
                    ),
                  ],
                ),
              ),

              const Divider(),

              // Scrollable content
              Expanded(
                child: ListView(
                  key: _formKey, // Force rebuild when key changes
                  controller: scrollController,
                  padding: const EdgeInsets.all(16.0),
                  children: [
                    // Meal Type Filter
                    _buildSectionTitle(localizations.filterByMealType),
                    _buildMealTypeChips(localizations),
                    const SizedBox(height: 24),

                    // Budget Range
                    _buildSectionTitle(localizations.budgetRange),
                    _buildRangeInputs(
                      localizations.minLabel,
                      localizations.maxLabel,
                      _minCost,
                      _maxCost,
                      (min) => setState(() => _minCost = min),
                      (max) => setState(() => _maxCost = max),
                      suffix: currencyProvider.symbol,
                      step: 0.5,
                    ),
                    const SizedBox(height: 24),

                    // Nutrition Filters
                    _buildSectionTitle(localizations.nutritionFilters),
                    const SizedBox(height: 12),

                    _buildSubSectionTitle(localizations.caloriesLabel),
                    _buildRangeInputs(
                      localizations.minLabel,
                      localizations.maxLabel,
                      _minCalories,
                      _maxCalories,
                      (min) => setState(() => _minCalories = min),
                      (max) => setState(() => _maxCalories = max),
                      suffix: localizations.kcal,
                      step: 50,
                    ),
                    const SizedBox(height: 12),

                    _buildSubSectionTitle(localizations.proteinLabel),
                    _buildRangeInputs(
                      localizations.minLabel,
                      localizations.maxLabel,
                      _minProtein,
                      _maxProtein,
                      (min) => setState(() => _minProtein = min),
                      (max) => setState(() => _maxProtein = max),
                      suffix: translateUnit(context, 'g'),
                      step: 5,
                    ),
                    const SizedBox(height: 12),

                    _buildSubSectionTitle(localizations.carbsLabel),
                    _buildRangeInputs(
                      localizations.minLabel,
                      localizations.maxLabel,
                      _minCarbs,
                      _maxCarbs,
                      (min) => setState(() => _minCarbs = min),
                      (max) => setState(() => _maxCarbs = max),
                      suffix: translateUnit(context, 'g'),
                      step: 5,
                    ),
                    const SizedBox(height: 12),

                    _buildSubSectionTitle(localizations.fatLabel),
                    _buildRangeInputs(
                      localizations.minLabel,
                      localizations.maxLabel,
                      _minFat,
                      _maxFat,
                      (min) => setState(() => _minFat = min),
                      (max) => setState(() => _maxFat = max),
                      suffix: translateUnit(context, 'g'),
                      step: 5,
                    ),
                    const SizedBox(height: 24),

                    // Time Filters
                    _buildSectionTitle(localizations.timeFilters),
                    _buildRangeInputs(
                      localizations.minLabel,
                      localizations.maxLabel,
                      _minTotalTime?.toDouble(),
                      _maxTotalTime?.toDouble(),
                      (min) => setState(() => _minTotalTime = min?.toInt()),
                      (max) => setState(() => _maxTotalTime = max?.toInt()),
                      suffix: localizations.minutesAbbr,
                      step: 15,
                    ),
                    const SizedBox(height: 24),

                    // Rating Filters
                    _buildSectionTitle(localizations.ratingFilters),
                    const SizedBox(height: 12),

                    _buildSubSectionTitle(localizations.difficultyRatingLabel),
                    _buildRatingRange(
                      _minDifficultyRating,
                      _maxDifficultyRating,
                      (min) => setState(() => _minDifficultyRating = min),
                      (max) => setState(() => _maxDifficultyRating = max),
                      localizations,
                    ),
                    const SizedBox(height: 12),

                    _buildSubSectionTitle(localizations.tasteRatingLabel),
                    _buildRatingRange(
                      _minTasteRating,
                      _maxTasteRating,
                      (min) => setState(() => _minTasteRating = min),
                      (max) => setState(() => _maxTasteRating = max),
                      localizations,
                    ),
                    const SizedBox(height: 12),

                    _buildSubSectionTitle(localizations.healthRatingLabel),
                    _buildRatingRange(
                      _minHealthRating,
                      _maxHealthRating,
                      (min) => setState(() => _minHealthRating = min),
                      (max) => setState(() => _maxHealthRating = max),
                      localizations,
                    ),
                    const SizedBox(height: 24),

                    // Additional Filters
                    _buildSectionTitle(localizations.additionalFilters),
                    _buildCheckboxTile(
                      localizations.hasImageFilter,
                      _hasImage,
                      (value) => setState(() => _hasImage = value),
                    ),
                    _buildCheckboxTile(
                      localizations.approvedOnlyFilter,
                      _approvedOnly,
                      (value) => setState(() => _approvedOnly = value),
                    ),
                    _buildCheckboxTile(
                      localizations.featuredOnlyFilter,
                      _featuredOnly,
                      (value) => setState(() => _featuredOnly = value),
                    ),

                    const SizedBox(height: 80), // Space for button
                  ],
                ),
              ),

              // Apply button
              Container(
                padding: const EdgeInsets.all(16.0),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _applyFilters,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGreen,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(localizations.applyFilters),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppTheme.textOnLight,
      ),
    );
  }

  Widget _buildSubSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppTheme.textSecondary,
      ),
    );
  }

  Widget _buildMealTypeChips(AppLocalizations localizations) {
    final mealTypes = [
      {'value': null, 'label': localizations.allMealTypes},
      {'value': 'breakfast', 'label': localizations.breakfastSection},
      {'value': 'lunch', 'label': localizations.lunchSection},
      {'value': 'dinner', 'label': localizations.dinnerSection},
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children:
          mealTypes.map((type) {
            final isSelected = _selectedMealType == type['value'];
            final value = type['value'];
            return FilterChip(
              label: Text(type['label'] as String),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  _selectedMealType =
                      selected ? (value is String ? value : null) : null;
                });
              },
              selectedColor: AppTheme.primaryGreen.withOpacity(0.3),
              checkmarkColor: AppTheme.primaryGreen,
            );
          }).toList(),
    );
  }

  Widget _buildRangeInputs(
    String minLabel,
    String maxLabel,
    double? minValue,
    double? maxValue,
    Function(double?) onMinChanged,
    Function(double?) onMaxChanged, {
    String? suffix,
    double step = 1,
  }) {
    final localizations = AppLocalizations.of(context)!;

    return Row(
      children: [
        Expanded(
          child: TextFormField(
            decoration: InputDecoration(
              labelText: minLabel,
              suffixText: suffix,
              border: const OutlineInputBorder(),
              errorMaxLines: 1,
              helperText:
                  ' ', // Reserve space for error message to prevent layout shift
              helperMaxLines: 1,
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            initialValue: minValue?.toString() ?? '',
            autovalidateMode: AutovalidateMode.onUserInteraction,
            validator: (value) {
              if (value == null || value.isEmpty) return null;

              final parsed = double.tryParse(value);
              if (parsed == null) {
                return localizations.invalidNumber;
              }

              if (parsed < 0) {
                return localizations.mustBePositive;
              }

              if (maxValue != null && parsed > maxValue) {
                return localizations.minGreaterThanMax;
              }

              return null;
            },
            onChanged: (value) {
              if (value.isEmpty) {
                onMinChanged(null);
                return;
              }

              final parsed = double.tryParse(value);
              if (parsed != null && parsed >= 0) {
                onMinChanged(parsed);
              }
            },
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: TextFormField(
            decoration: InputDecoration(
              labelText: maxLabel,
              suffixText: suffix,
              border: const OutlineInputBorder(),
              errorMaxLines: 1,
              helperText:
                  ' ', // Reserve space for error message to prevent layout shift
              helperMaxLines: 1,
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            initialValue: maxValue?.toString() ?? '',
            autovalidateMode: AutovalidateMode.onUserInteraction,
            validator: (value) {
              if (value == null || value.isEmpty) return null;

              final parsed = double.tryParse(value);
              if (parsed == null) {
                return localizations.invalidNumber;
              }

              if (parsed < 0) {
                return localizations.mustBePositive;
              }

              if (minValue != null && parsed < minValue) {
                return localizations.maxLessThanMin;
              }

              return null;
            },
            onChanged: (value) {
              if (value.isEmpty) {
                onMaxChanged(null);
                return;
              }

              final parsed = double.tryParse(value);
              if (parsed != null && parsed >= 0) {
                onMaxChanged(parsed);
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildRatingRange(
    double? minValue,
    double? maxValue,
    Function(double?) onMinChanged,
    Function(double?) onMaxChanged,
    AppLocalizations localizations,
  ) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                '${localizations.minLabel}: ${minValue?.toStringAsFixed(1) ?? '0.0'}',
                style: TextStyle(color: AppTheme.textSecondary),
              ),
            ),
            Expanded(
              child: Text(
                '${localizations.maxLabel}: ${maxValue?.toStringAsFixed(1) ?? '5.0'}',
                style: TextStyle(color: AppTheme.textSecondary),
                textAlign: TextAlign.right,
              ),
            ),
          ],
        ),
        RangeSlider(
          values: RangeValues(minValue ?? 0.0, maxValue ?? 5.0),
          min: 0.0,
          max: 5.0,
          divisions: 10,
          activeColor: AppTheme.primaryGreen,
          labels: RangeLabels(
            minValue?.toStringAsFixed(1) ?? '0.0',
            maxValue?.toStringAsFixed(1) ?? '5.0',
          ),
          onChanged: (values) {
            onMinChanged(values.start);
            onMaxChanged(values.end);
          },
        ),
      ],
    );
  }

  Widget _buildCheckboxTile(
    String title,
    bool? value,
    Function(bool?) onChanged,
  ) {
    return CheckboxListTile(
      title: Text(title),
      value: value ?? false,
      tristate: true,
      activeColor: AppTheme.primaryGreen,
      onChanged: onChanged,
      controlAffinity: ListTileControlAffinity.leading,
    );
  }
}

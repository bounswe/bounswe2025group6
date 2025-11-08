import 'recipe.dart';

/// Represents a shopping list item aggregated from multiple recipes
class ShoppingListItem {
  final String ingredientName;
  final double quantity;
  final String unit;
  final List<String> fromRecipes; // Names of recipes using this ingredient
  bool isChecked;

  ShoppingListItem({
    required this.ingredientName,
    required this.quantity,
    required this.unit,
    required this.fromRecipes,
    this.isChecked = false,
  });

  /// Create a copy with updated fields
  ShoppingListItem copyWith({
    String? ingredientName,
    double? quantity,
    String? unit,
    List<String>? fromRecipes,
    bool? isChecked,
  }) {
    return ShoppingListItem(
      ingredientName: ingredientName ?? this.ingredientName,
      quantity: quantity ?? this.quantity,
      unit: unit ?? this.unit,
      fromRecipes: fromRecipes ?? this.fromRecipes,
      isChecked: isChecked ?? this.isChecked,
    );
  }

  /// Convert to JSON for sharing/export
  Map<String, dynamic> toJson() {
    return {
      'ingredientName': ingredientName,
      'quantity': quantity,
      'unit': unit,
      'fromRecipes': fromRecipes,
      'isChecked': isChecked,
    };
  }

  /// Create from JSON
  factory ShoppingListItem.fromJson(Map<String, dynamic> json) {
    return ShoppingListItem(
      ingredientName: json['ingredientName'] as String,
      quantity: (json['quantity'] as num).toDouble(),
      unit: json['unit'] as String,
      fromRecipes: List<String>.from(json['fromRecipes'] as List),
      isChecked: json['isChecked'] as bool? ?? false,
    );
  }

  @override
  String toString() {
    return '$quantity $unit $ingredientName';
  }
}

/// Represents a complete shopping list with cost breakdown
class ShoppingList {
  final List<ShoppingListItem> items;
  final double totalCost;
  final Map<String, double>? costByRetailer; // A101, SOK, BIM, MIGROS
  final DateTime createdAt;
  final List<String> recipeNames; // Names of recipes in the meal plan

  ShoppingList({
    required this.items,
    required this.totalCost,
    this.costByRetailer,
    required this.createdAt,
    required this.recipeNames,
  });

  /// Get the cheapest retailer option
  String? getCheapestRetailer() {
    if (costByRetailer == null || costByRetailer!.isEmpty) return null;
    
    var sortedEntries = costByRetailer!.entries.toList()
      ..sort((a, b) => a.value.compareTo(b.value));
    
    return sortedEntries.first.key;
  }

  /// Get the cheapest cost
  double? getCheapestCost() {
    if (costByRetailer == null || costByRetailer!.isEmpty) return null;
    
    return costByRetailer!.values.reduce((a, b) => a < b ? a : b);
  }

  /// Calculate number of checked items
  int getCheckedItemsCount() {
    return items.where((item) => item.isChecked).length;
  }

  /// Generate shopping list from selected recipes
  static ShoppingList fromRecipes(List<Recipe> recipes) {
    // Aggregate ingredients from all recipes
    Map<String, ShoppingListItem> aggregatedItems = {};

    for (var recipe in recipes) {
      for (var ingredient in recipe.ingredients) {
        final key = '${ingredient.ingredient.name}_${ingredient.unit}';
        
        if (aggregatedItems.containsKey(key)) {
          // Add to existing quantity
          final existingItem = aggregatedItems[key]!;
          aggregatedItems[key] = existingItem.copyWith(
            quantity: existingItem.quantity + ingredient.quantity,
            fromRecipes: [...existingItem.fromRecipes, recipe.name],
          );
        } else {
          // Create new item
          aggregatedItems[key] = ShoppingListItem(
            ingredientName: ingredient.ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            fromRecipes: [recipe.name],
          );
        }
      }
    }

    // Calculate total cost (sum of all recipe costs)
    double totalCost = 0.0;
    for (var recipe in recipes) {
      if (recipe.costPerServing != null) {
        totalCost += recipe.costPerServing!;
      }
    }

    // Note: costByRetailer would need to be calculated via backend or
    // stored in recipe model. For now, we'll leave it null since the
    // Recipe model only has cost_per_serving which is the minimum cost.
    
    return ShoppingList(
      items: aggregatedItems.values.toList()
        ..sort((a, b) => a.ingredientName.compareTo(b.ingredientName)),
      totalCost: totalCost,
      costByRetailer: null, // Could be enhanced later
      createdAt: DateTime.now(),
      recipeNames: recipes.map((r) => r.name).toList(),
    );
  }

  /// Convert to shareable plain text format with localized labels
  String toPlainText({
    String currencySymbol = '\$',
    String? formattedDate,
    String titleLabel = 'Shopping List',
    String generatedLabel = 'Generated',
    String recipesLabel = 'Recipes',
    String ingredientsLabel = 'Ingredients',
    String itemsLabel = 'items',
    String totalCostLabel = 'Total Cost',
    String costByRetailerLabel = 'Cost by Retailer',
    String bestLabel = 'Best',
    String footerLabel = 'Generated by FitHub Meal Planner',
  }) {
    final buffer = StringBuffer();
    buffer.writeln('🛒 $titleLabel');
    
    // Use formatted date if provided, otherwise default format
    if (formattedDate != null && formattedDate.isNotEmpty) {
      buffer.writeln('$generatedLabel: $formattedDate');
    } else {
      buffer.writeln('$generatedLabel: ${createdAt.toString().split('.')[0]}');
    }
    
    buffer.writeln('');
    buffer.writeln('📋 $recipesLabel:');
    for (var recipeName in recipeNames) {
      buffer.writeln('  • $recipeName');
    }
    buffer.writeln('');
    buffer.writeln('🥕 $ingredientsLabel (${items.length} $itemsLabel):');
    buffer.writeln('');
    
    for (var item in items) {
      final checkMark = item.isChecked ? '✓' : '○';
      buffer.writeln('$checkMark ${item.quantity} ${item.unit} ${item.ingredientName}');
    }
    
    buffer.writeln('');
    buffer.writeln('💰 $totalCostLabel: $currencySymbol${totalCost.toStringAsFixed(2)}');
    
    if (costByRetailer != null && costByRetailer!.isNotEmpty) {
      buffer.writeln('');
      buffer.writeln('🏪 $costByRetailerLabel:');
      costByRetailer!.forEach((retailer, cost) {
        buffer.writeln('  $retailer: $currencySymbol${cost.toStringAsFixed(2)}');
      });
      
      final cheapest = getCheapestRetailer();
      if (cheapest != null) {
        buffer.writeln('  ⭐ $bestLabel: $cheapest');
      }
    }
    
    buffer.writeln('');
    buffer.writeln(footerLabel);
    
    return buffer.toString();
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'items': items.map((item) => item.toJson()).toList(),
      'totalCost': totalCost,
      'costByRetailer': costByRetailer,
      'createdAt': createdAt.toIso8601String(),
      'recipeNames': recipeNames,
    };
  }

  /// Create from JSON
  factory ShoppingList.fromJson(Map<String, dynamic> json) {
    return ShoppingList(
      items: (json['items'] as List)
          .map((item) => ShoppingListItem.fromJson(item))
          .toList(),
      totalCost: (json['totalCost'] as num).toDouble(),
      costByRetailer: json['costByRetailer'] != null
          ? Map<String, double>.from(json['costByRetailer'])
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      recipeNames: List<String>.from(json['recipeNames'] as List),
    );
  }

  /// Create a copy with updated items
  ShoppingList copyWith({
    List<ShoppingListItem>? items,
    double? totalCost,
    Map<String, double>? costByRetailer,
    DateTime? createdAt,
    List<String>? recipeNames,
  }) {
    return ShoppingList(
      items: items ?? this.items,
      totalCost: totalCost ?? this.totalCost,
      costByRetailer: costByRetailer ?? this.costByRetailer,
      createdAt: createdAt ?? this.createdAt,
      recipeNames: recipeNames ?? this.recipeNames,
    );
  }
}


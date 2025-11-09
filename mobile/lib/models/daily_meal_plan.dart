import 'recipe.dart';

/// Represents a daily meal plan with breakfast, lunch, and dinner selections
class DailyMealPlan {
  final DateTime date;
  Recipe? breakfast;
  Recipe? lunch;
  Recipe? dinner;

  DailyMealPlan({
    required this.date,
    this.breakfast,
    this.lunch,
    this.dinner,
  });

  /// Get all selected recipes as a list
  List<Recipe> getAllRecipes() {
    final recipes = <Recipe>[];
    if (breakfast != null) recipes.add(breakfast!);
    if (lunch != null) recipes.add(lunch!);
    if (dinner != null) recipes.add(dinner!);
    return recipes;
  }

  /// Get the total cost of all meals for the day
  double getTotalCost() {
    double total = 0.0;
    if (breakfast?.costPerServing != null) {
      total += breakfast!.costPerServing!;
    }
    if (lunch?.costPerServing != null) {
      total += lunch!.costPerServing!;
    }
    if (dinner?.costPerServing != null) {
      total += dinner!.costPerServing!;
    }
    return total;
  }

  /// Get total nutrition for the day
  Map<String, double> getTotalNutrition() {
    double totalCalories = 0.0;
    double totalProtein = 0.0;
    double totalFat = 0.0;
    double totalCarbs = 0.0;

    for (var recipe in getAllRecipes()) {
      // Note: Nutrition values might be null in the recipe model
      // We handle null values gracefully
      totalCalories += (recipe.healthRating ?? 0.0); // Placeholder - actual calories not in model
      totalProtein += 0.0; // Placeholder
      totalFat += 0.0; // Placeholder
      totalCarbs += 0.0; // Placeholder
    }

    return {
      'calories': totalCalories,
      'protein': totalProtein,
      'fat': totalFat,
      'carbs': totalCarbs,
    };
  }

  /// Get all allergens from selected recipes
  List<String> getAllAllergens() {
    final allergens = <String>{};
    for (var recipe in getAllRecipes()) {
      allergens.addAll(recipe.allergens);
    }
    return allergens.toList()..sort();
  }

  /// Check if the meal plan has any recipes selected
  bool hasRecipes() {
    return breakfast != null || lunch != null || dinner != null;
  }

  /// Check if the meal plan is complete (has all three meals)
  bool isComplete() {
    return breakfast != null && lunch != null && dinner != null;
  }

  /// Get number of selected meals
  int getSelectedMealsCount() {
    int count = 0;
    if (breakfast != null) count++;
    if (lunch != null) count++;
    if (dinner != null) count++;
    return count;
  }

  /// Set a recipe for a specific meal type
  void setMeal(String mealType, Recipe? recipe) {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        breakfast = recipe;
        break;
      case 'lunch':
        lunch = recipe;
        break;
      case 'dinner':
        dinner = recipe;
        break;
    }
  }

  /// Get a recipe for a specific meal type
  Recipe? getMeal(String mealType) {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return breakfast;
      case 'lunch':
        return lunch;
      case 'dinner':
        return dinner;
      default:
        return null;
    }
  }

  /// Clear a specific meal
  void clearMeal(String mealType) {
    setMeal(mealType, null);
  }

  /// Clear all meals
  void clearAll() {
    breakfast = null;
    lunch = null;
    dinner = null;
  }

  /// Create a copy with updated values
  DailyMealPlan copyWith({
    DateTime? date,
    Recipe? breakfast,
    Recipe? lunch,
    Recipe? dinner,
    bool clearBreakfast = false,
    bool clearLunch = false,
    bool clearDinner = false,
  }) {
    return DailyMealPlan(
      date: date ?? this.date,
      breakfast: clearBreakfast ? null : (breakfast ?? this.breakfast),
      lunch: clearLunch ? null : (lunch ?? this.lunch),
      dinner: clearDinner ? null : (dinner ?? this.dinner),
    );
  }

  /// Convert to JSON for storage
  Map<String, dynamic> toJson() {
    return {
      'date': date.toIso8601String(),
      'breakfast': breakfast?.id,
      'lunch': lunch?.id,
      'dinner': dinner?.id,
    };
  }

  /// Create from JSON (note: needs recipes to be provided separately)
  factory DailyMealPlan.fromJson(
    Map<String, dynamic> json, {
    Recipe? breakfast,
    Recipe? lunch,
    Recipe? dinner,
  }) {
    return DailyMealPlan(
      date: DateTime.parse(json['date'] as String),
      breakfast: breakfast,
      lunch: lunch,
      dinner: dinner,
    );
  }

  /// Convert to a simple summary string
  String toSummary() {
    final buffer = StringBuffer();
    buffer.writeln('Meal Plan for ${date.toString().split(' ')[0]}');
    buffer.writeln('');
    
    if (breakfast != null) {
      buffer.writeln('🌅 Breakfast: ${breakfast!.name}');
    } else {
      buffer.writeln('🌅 Breakfast: Not selected');
    }
    
    if (lunch != null) {
      buffer.writeln('☀️ Lunch: ${lunch!.name}');
    } else {
      buffer.writeln('☀️ Lunch: Not selected');
    }
    
    if (dinner != null) {
      buffer.writeln('🌙 Dinner: ${dinner!.name}');
    } else {
      buffer.writeln('🌙 Dinner: Not selected');
    }
    
    buffer.writeln('');
    buffer.writeln('Total Cost: \$${getTotalCost().toStringAsFixed(2)}');
    
    return buffer.toString();
  }

  @override
  String toString() {
    return 'DailyMealPlan(date: $date, breakfast: ${breakfast?.name}, '
        'lunch: ${lunch?.name}, dinner: ${dinner?.name})';
  }
}


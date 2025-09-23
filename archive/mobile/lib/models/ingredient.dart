import 'package:flutter/foundation.dart';

class IngredientDetail {
  final int id;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedOn;
  final String name;
  final String category;
  final List<String> allergens;
  final List<String> dietaryInfo;

  IngredientDetail({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    this.deletedOn,
    required this.name,
    required this.category,
    required this.allergens,
    required this.dietaryInfo,
  });

  factory IngredientDetail.fromJson(Map<String, dynamic> json) {
    var allergensList =
        (json['allergens'] as List<dynamic>? ?? [])
            .map((a) => a.toString())
            .toList();

    var dietaryInfoList =
        (json['dietary_info'] as List<dynamic>? ?? [])
            .map((d) => d.toString())
            .toList();

    return IngredientDetail(
      id: json['id'] as int,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      deletedOn:
          json['deleted_on'] == null
              ? null
              : DateTime.parse(json['deleted_on'] as String),
      name: json['name'] as String,
      category: json['category'] as String,
      allergens: allergensList,
      dietaryInfo: dietaryInfoList,
    );
  }
}

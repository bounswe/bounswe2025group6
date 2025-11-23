import 'recipe.dart';

/// Model to hold paginated recipe results with metadata
class PaginatedRecipes {
  final int page;
  final int pageSize;
  final int total;
  final List<Recipe> results;
  final String? next;
  final String? previous;

  PaginatedRecipes({
    required this.page,
    required this.pageSize,
    required this.total,
    required this.results,
    this.next,
    this.previous,
  });

  factory PaginatedRecipes.fromJson(
    Map<String, dynamic> json, {
    int fallbackPage = 1,
    int fallbackPageSize = 10,
  }) {
    final List<dynamic> resultsJson = json['results'] as List<dynamic>? ?? [];
    
    List<Recipe> recipes = [];
    for (var data in resultsJson) {
      try {
        final recipe = Recipe.fromListJson(data as Map<String, dynamic>);
        recipes.add(recipe);
      } catch (e) {
        print('PaginatedRecipes: Error parsing recipe: $e');
        // Skip this recipe and continue with others
      }
    }

    final String? next = json['next'] as String?;
    final String? previous = json['previous'] as String?;
    final int? explicitPage = json['page'] as int?;
    final int? explicitPageSize = json['page_size'] as int?;
    final int? totalFromApi = (json['total'] ?? json['count']) as int?;

    return PaginatedRecipes(
      page: explicitPage ??
          _derivePageFromLinks(
            next: next,
            previous: previous,
            fallback: fallbackPage,
          ),
      pageSize: explicitPageSize ??
          _extractPageSizeFromUrl(next) ??
          fallbackPageSize,
      total: totalFromApi ?? recipes.length,
      results: recipes,
      next: next,
      previous: previous,
    );
  }

  /// Check if there are more pages available
  bool get hasMorePages {
    if (next != null) return true;
    // Protect against divide-by-zero when API does not send page_size
    final effectivePageSize = pageSize == 0 ? 1 : pageSize;
    final totalPages = (total / effectivePageSize).ceil();
    return page < totalPages;
  }

  /// Get the next page number
  int get nextPage => page + 1;

  static int _derivePageFromLinks({
    String? next,
    String? previous,
    required int fallback,
  }) {
    final previousPage = _extractPageFromUrl(previous);
    if (previousPage != null) return previousPage + 1;

    final nextPage = _extractPageFromUrl(next);
    if (nextPage != null && nextPage > 1) return nextPage - 1;

    return fallback;
  }

  static int? _extractPageFromUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    final uri = Uri.tryParse(url);
    final pageValue = uri?.queryParameters['page'];
    if (pageValue == null) return null;
    return int.tryParse(pageValue);
  }

  static int? _extractPageSizeFromUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    final uri = Uri.tryParse(url);
    final pageSizeValue = uri?.queryParameters['page_size'];
    if (pageSizeValue == null) return null;
    return int.tryParse(pageSizeValue);
  }
}

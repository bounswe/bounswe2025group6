import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/currency_provider.dart';
import '../l10n/app_localizations.dart';

/// Widget to display market price breakdown for a recipe
/// Shows prices from different markets (A101, SOK, BIM, MIGROS) and highlights the lowest
class MarketPricesWidget extends StatelessWidget {
  final Map<String, dynamic>? recipeCosts;
  final double? costPerServing; // The lowest price among markets
  final String? title;

  const MarketPricesWidget({
    Key? key,
    required this.recipeCosts,
    this.costPerServing,
    this.title,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (recipeCosts == null) {
      return const SizedBox.shrink();
    }

    // Extract market prices
    final markets = ['A101', 'SOK', 'BIM', 'MIGROS'];
    final marketPrices = <String, double>{};

    for (final market in markets) {
      final price = _parsePrice(recipeCosts![market]);
      if (price != null && price > 0) {
        marketPrices[market] = price;
      }
    }

    if (marketPrices.isEmpty) {
      return const SizedBox.shrink();
    }

    // Find the lowest price
    final lowestPrice = marketPrices.values.reduce((a, b) => a < b ? a : b);
    final currencySymbol =
        Provider.of<CurrencyProvider>(context, listen: false).symbol;

    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.store,
                      color: AppTheme.primaryGreen,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title ?? AppLocalizations.of(context)!.marketPrices,
                          style: Theme.of(
                            context,
                          ).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                        if (costPerServing != null && costPerServing! > 0)
                          Text(
                            '${AppLocalizations.of(context)!.bestPrice}: $currencySymbol${costPerServing!.toStringAsFixed(2)}',
                            style: Theme.of(
                              context,
                            ).textTheme.bodySmall?.copyWith(
                              color: Colors.green[700],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Market prices list
              ...marketPrices.entries.map((entry) {
                final isLowest = (entry.value - lowestPrice).abs() < 0.01;
                return _buildMarketPriceRow(
                  context,
                  entry.key,
                  entry.value,
                  currencySymbol,
                  isLowest,
                );
              }).toList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMarketPriceRow(
    BuildContext context,
    String marketName,
    double price,
    String currencySymbol,
    bool isLowest,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color:
            isLowest
                ? AppTheme.primaryGreen.withOpacity(0.1)
                : Colors.grey.withOpacity(0.05),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color:
              isLowest
                  ? AppTheme.primaryGreen.withOpacity(0.3)
                  : Colors.grey.withOpacity(0.2),
          width: isLowest ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          // Market logo/icon
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: _getMarketColor(marketName).withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                marketName,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: _getMarketColor(marketName),
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),

          // Price
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getMarketFullName(marketName),
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      '$currencySymbol${price.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color:
                            isLowest ? AppTheme.primaryGreen : Colors.black87,
                      ),
                    ),
                    if (isLowest) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          AppLocalizations.of(context)!.bestPrice,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),

          // Check icon for lowest
          if (isLowest)
            Icon(Icons.check_circle, color: AppTheme.primaryGreen, size: 28),
        ],
      ),
    );
  }

  Color _getMarketColor(String marketName) {
    switch (marketName) {
      case 'A101':
        return Colors.red;
      case 'SOK':
        return Colors.blue;
      case 'BIM':
        return Colors.purple;
      case 'MIGROS':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _getMarketFullName(String marketName) {
    switch (marketName) {
      case 'A101':
        return 'A101 Market';
      case 'SOK':
        return 'ŞOK Market';
      case 'BIM':
        return 'BİM Market';
      case 'MIGROS':
        return 'Migros';
      default:
        return marketName;
    }
  }

  double? _parsePrice(dynamic value) {
    if (value == null) return null;
    if (value is num) {
      return value.toDouble();
    }
    return double.tryParse(value.toString());
  }
}

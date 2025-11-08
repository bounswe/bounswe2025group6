import 'package:flutter/material.dart';

import '../l10n/app_localizations.dart';
import '../theme/app_theme.dart';
import '../models/analytics_model.dart';
import '../services/analytics_service.dart';

class DashboardAnalyticsWidget extends StatefulWidget {
  final AnalyticsService? service;
  final int? refreshTick; // triggers reload when changed

  const DashboardAnalyticsWidget({super.key, this.service, this.refreshTick});

  @override
  State<DashboardAnalyticsWidget> createState() =>
      _DashboardAnalyticsWidgetState();
}

class _DashboardAnalyticsWidgetState extends State<DashboardAnalyticsWidget> {
  late Future<Analytics> _future;
  int? _lastRefreshTick;

  @override
  void initState() {
    super.initState();
    _future = (widget.service ?? AnalyticsService()).getAnalytics();
  }

  void _retry() {
    setState(() {
      _future = (widget.service ?? AnalyticsService()).getAnalytics();
    });
  }

  @override
  void didUpdateWidget(covariant DashboardAnalyticsWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    // If refreshTick changed, refetch analytics
    if (widget.refreshTick != null && widget.refreshTick != _lastRefreshTick) {
      _lastRefreshTick = widget.refreshTick;
      setState(() {
        _future = (widget.service ?? AnalyticsService()).getAnalytics();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context)!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FutureBuilder<Analytics>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _AnalyticsCard.loading(title: loc.dashboardAnalyticsTitle);
            }

            if (snapshot.hasError) {
              return _ErrorCard(
                message: loc.failedToLoadAnalytics('${snapshot.error}'),
                onRetry: _retry,
              );
            }

            final data = snapshot.data!;
            return _AnalyticsCard(
              title: loc.dashboardAnalyticsTitle,
              metrics: [
                _Metric(
                  icon: Icons.people,
                  color: AppTheme.primaryGreen,
                  label: loc.analyticsUsers,
                  value: data.usersCount,
                ),
                _Metric(
                  icon: Icons.menu_book,
                  color: Colors.blue,
                  label: loc.analyticsRecipes,
                  value: data.recipesCount,
                ),
                _Metric(
                  icon: Icons.kitchen,
                  color: Colors.orange,
                  label: loc.analyticsIngredients,
                  value: data.ingredientsCount,
                ),
                _Metric(
                  icon: Icons.article,
                  color: Colors.purple,
                  label: loc.analyticsPosts,
                  value: data.postsCount,
                ),
                _Metric(
                  icon: Icons.comment,
                  color: Colors.teal,
                  label: loc.analyticsComments,
                  value: data.commentsCount,
                ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _Metric {
  final IconData icon;
  final Color color;
  final String label;
  final int value;

  _Metric({
    required this.icon,
    required this.color,
    required this.label,
    required this.value,
  });
}

class _AnalyticsCard extends StatelessWidget {
  final String title;
  final List<_Metric>? metrics;
  final bool isLoading;

  const _AnalyticsCard({
    required this.title,
    this.metrics,
    this.isLoading = false,
  });

  factory _AnalyticsCard.loading({required String title}) =>
      _AnalyticsCard(title: title, isLoading: true);

  @override
  Widget build(BuildContext context) {
    final titleStyle = Theme.of(context).textTheme.displaySmall;
    return Card(
      elevation: 2,
      color: Theme.of(context).colorScheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.insights, color: AppTheme.primaryGreen),
                const SizedBox(width: 8),
                Text(title, style: titleStyle),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),
            LayoutBuilder(
              builder: (context, constraints) {
                final width = constraints.maxWidth;
                final cols =
                    width >= 900
                        ? 4
                        : width >= 600
                        ? 3
                        : 2;
                const spacing = 16.0;
                final itemWidth = (width - spacing * (cols - 1)) / cols;

                if (isLoading) {
                  return _MetricsSkeleton(
                    itemWidth: itemWidth,
                    spacing: spacing,
                  );
                }

                return Wrap(
                  spacing: spacing,
                  runSpacing: 12,
                  children:
                      metrics!
                          .map(
                            (m) => SizedBox(
                              width: itemWidth,
                              child: _MetricItem(
                                icon: m.icon,
                                color: m.color,
                                label: m.label,
                                value: m.value,
                              ),
                            ),
                          )
                          .toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricItem extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final int value;

  const _MetricItem({
    required this.icon,
    required this.color,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final labelStyle = Theme.of(context).textTheme.bodyMedium?.copyWith(
      color: AppTheme.textSecondary,
      fontWeight: FontWeight.w600,
    );
    final valueStyle = Theme.of(context).textTheme.titleMedium?.copyWith(
      fontSize: 22,
      fontWeight: FontWeight.bold,
      color: AppTheme.textOnLight,
    );

    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 120),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            padding: const EdgeInsets.all(8),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(value.toString(), style: valueStyle),
              const SizedBox(height: 2),
              Text(label, style: labelStyle),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricsSkeleton extends StatelessWidget {
  final double itemWidth;
  final double spacing;

  const _MetricsSkeleton({required this.itemWidth, required this.spacing});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: spacing,
      runSpacing: 12,
      children: List.generate(
        5,
        (index) => SizedBox(width: itemWidth, child: _skeletonItem()),
      ),
    );
  }

  Widget _skeletonItem() {
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 120),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppTheme.textSecondary.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _skeletonLine(width: 40, height: 20),
              const SizedBox(height: 4),
              _skeletonLine(width: 80, height: 14),
            ],
          ),
        ],
      ),
    );
  }

  Widget _skeletonLine({double width = 80, double height = 14}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppTheme.textSecondary.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorCard({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      color: Theme.of(context).colorScheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: AppTheme.errorColor),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            const SizedBox(width: 8),
            TextButton(
              onPressed: onRetry,
              child: Text(
                AppLocalizations.of(context)!.retry,
                style: const TextStyle(
                  color: AppTheme.primaryGreen,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

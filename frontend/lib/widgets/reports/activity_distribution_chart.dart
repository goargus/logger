import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../models/report_breakdown.dart';
import '../../models/user_activities.dart';
import '../../utils/currency_formatter.dart';

/// Data item for activity distribution chart
class ActivityDistributionItem {
  final String name;
  final int count;
  final double expenses;
  final Color color;

  const ActivityDistributionItem({
    required this.name,
    required this.count,
    required this.expenses,
    required this.color,
  });

  factory ActivityDistributionItem.fromBreakdown(
    ReportBreakdown breakdown,
    Color color,
  ) {
    return ActivityDistributionItem(
      name: breakdown.activityTypeName,
      count: breakdown.count,
      expenses: breakdown.totalExpenses,
      color: color,
    );
  }
}

/// Pie chart showing activity distribution by type
class ActivityDistributionChart extends StatefulWidget {
  const ActivityDistributionChart({
    super.key,
    required this.items,
    this.title = 'Distribución de Actividades',
    this.showExpenses = false,
    this.height = 250,
    this.currencySymbol = '\$',
  });

  final List<ActivityDistributionItem> items;
  final String title;
  final bool showExpenses;
  final double height;
  final String currencySymbol;

  /// Create from ReportBreakdown list
  factory ActivityDistributionChart.fromBreakdowns({
    Key? key,
    required List<ReportBreakdown> breakdowns,
    String title = 'Distribución de Actividades',
    bool showExpenses = false,
    double height = 250,
    String currencySymbol = '\$',
  }) {
    // Sort by count or expenses descending
    final sorted = List<ReportBreakdown>.from(breakdowns);
    if (showExpenses) {
      sorted.sort((a, b) => b.totalExpenses.compareTo(a.totalExpenses));
    } else {
      sorted.sort((a, b) => b.count.compareTo(a.count));
    }

    final colors = _generateColors(sorted.length);
    final items = sorted.asMap().entries.map((entry) {
      return ActivityDistributionItem.fromBreakdown(
        entry.value,
        colors[entry.key],
      );
    }).toList();

    return ActivityDistributionChart(
      key: key,
      items: items,
      title: title,
      showExpenses: showExpenses,
      height: height,
      currencySymbol: currencySymbol,
    );
  }

  /// Create from UserActivity list (computes distribution)
  factory ActivityDistributionChart.fromActivities({
    Key? key,
    required List<UserActivity> activities,
    String title = 'Distribución de Actividades',
    bool showExpenses = false,
    double height = 250,
    String currencySymbol = '\$',
  }) {
    // Group activities by type
    final typeMap = <String, _TypeAccumulator>{};
    for (final activity in activities) {
      final acc = typeMap.putIfAbsent(
        activity.typeName,
        () => _TypeAccumulator(activity.typeName),
      );
      acc.count++;
      if (activity.hasExpense) {
        acc.expenses += activity.expenseAmountValue;
      }
    }

    // Sort by count or expenses descending
    final sortedTypes = typeMap.values.toList();
    if (showExpenses) {
      sortedTypes.sort((a, b) => b.expenses.compareTo(a.expenses));
    } else {
      sortedTypes.sort((a, b) => b.count.compareTo(a.count));
    }

    final colors = _generateColors(sortedTypes.length);
    final items = sortedTypes.asMap().entries.map((entry) {
      final acc = entry.value;
      return ActivityDistributionItem(
        name: acc.name,
        count: acc.count,
        expenses: acc.expenses,
        color: colors[entry.key],
      );
    }).toList();

    return ActivityDistributionChart(
      key: key,
      items: items,
      title: title,
      showExpenses: showExpenses,
      height: height,
      currencySymbol: currencySymbol,
    );
  }

  static List<Color> _generateColors(int count) {
    const baseColors = [
      Color(0xFF2196F3), // Blue
      Color(0xFF4CAF50), // Green
      Color(0xFFF44336), // Red
      Color(0xFFFF9800), // Orange
      Color(0xFF9C27B0), // Purple
      Color(0xFF00BCD4), // Cyan
      Color(0xFFE91E63), // Pink
      Color(0xFF795548), // Brown
      Color(0xFF607D8B), // Blue Grey
      Color(0xFF3F51B5), // Indigo
    ];

    return List.generate(count, (i) => baseColors[i % baseColors.length]);
  }

  @override
  State<ActivityDistributionChart> createState() =>
      _ActivityDistributionChartState();
}

class _TypeAccumulator {
  final String name;
  int count = 0;
  double expenses = 0;

  _TypeAccumulator(this.name);
}

class _ActivityDistributionChartState extends State<ActivityDistributionChart> {
  int _touchedIndex = -1;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (widget.items.isEmpty) {
      return Card(
        child: Container(
          height: widget.height,
          padding: const EdgeInsets.all(16),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.pie_chart_outline,
                  size: 48,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(height: 8),
                Text(
                  'Sin datos para mostrar',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final total = widget.showExpenses
        ? widget.items.fold<double>(0, (sum, item) => sum + item.expenses)
        : widget.items.fold<int>(0, (sum, item) => sum + item.count).toDouble();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.pie_chart, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  widget.title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: widget.height,
              child: Row(
                children: [
                  // Pie chart
                  Expanded(
                    flex: 3,
                    child: PieChart(
                      PieChartData(
                        pieTouchData: PieTouchData(
                          touchCallback: (event, response) {
                            setState(() {
                              if (!event.isInterestedForInteractions ||
                                  response == null ||
                                  response.touchedSection == null) {
                                _touchedIndex = -1;
                                return;
                              }
                              _touchedIndex =
                                  response.touchedSection!.touchedSectionIndex;
                            });
                          },
                        ),
                        sectionsSpace: 2,
                        centerSpaceRadius: 40,
                        sections: _buildSections(total),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Legend
                  Expanded(
                    flex: 2,
                    child: _buildLegend(theme, total),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<PieChartSectionData> _buildSections(double total) {
    return widget.items.asMap().entries.map((entry) {
      final index = entry.key;
      final item = entry.value;
      final isTouched = index == _touchedIndex;
      final value = widget.showExpenses ? item.expenses : item.count.toDouble();
      final percentage = total > 0 ? (value / total * 100) : 0;

      return PieChartSectionData(
        color: item.color,
        value: value,
        title: percentage >= 5 ? '${percentage.toStringAsFixed(0)}%' : '',
        radius: isTouched ? 60 : 50,
        titleStyle: TextStyle(
          fontSize: isTouched ? 14 : 12,
          fontWeight: FontWeight.bold,
          color: Colors.white,
          shadows: const [
            Shadow(color: Colors.black26, blurRadius: 2),
          ],
        ),
        badgeWidget: isTouched ? _buildBadge(item) : null,
        badgePositionPercentageOffset: 1.3,
      );
    }).toList();
  }

  Widget _buildBadge(ActivityDistributionItem item) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: item.color,
        borderRadius: BorderRadius.circular(4),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        widget.showExpenses
            ? CurrencyFormatter.format(item.expenses, widget.currencySymbol,
                decimals: 0)
            : '${item.count}',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildLegend(ThemeData theme, double total) {
    final isMobile = MediaQuery.of(context).size.width < 600;
    
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: widget.items.map((item) {
          final value =
              widget.showExpenses ? item.expenses : item.count.toDouble();
          final percentage = total > 0 ? (value / total * 100) : 0;

          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 12,
                  height: 12,
                  margin: const EdgeInsets.only(top: 2),
                  decoration: BoxDecoration(
                    color: item.color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.name,
                        style: theme.textTheme.bodySmall,
                        maxLines: isMobile ? 2 : 1,
                        overflow: isMobile ? TextOverflow.ellipsis : TextOverflow.clip,
                        softWrap: isMobile,
                      ),
                      if (isMobile) const SizedBox(height: 2),
                      Row(
                        children: [
                          Text(
                            widget.showExpenses
                                ? CurrencyFormatter.format(
                                    item.expenses, widget.currencySymbol,
                                    decimals: 0)
                                : '${item.count}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '(${percentage.toStringAsFixed(0)}%)',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

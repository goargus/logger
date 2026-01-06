import 'package:flutter/material.dart';
import '../../models/hierarchy_breakdown.dart';
import '../../models/entity_hierarchy.dart';
import '../../utils/currency_formatter.dart';

/// A card widget displaying per-entity breakdown in a data table
class HierarchyBreakdownCard extends StatelessWidget {
  const HierarchyBreakdownCard({
    super.key,
    required this.breakdown,
    this.onEntityTap,
    this.title = 'Desglose por Entidad',
    this.currencySymbol = '\$',
  });

  final List<HierarchyEntityBreakdown> breakdown;
  final ValueChanged<String>? onEntityTap;
  final String title;
  final String currencySymbol;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (breakdown.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(
                Icons.analytics_outlined,
                size: 48,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: 8),
              Text(
                'No hay datos de desglose',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.account_tree,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                columnSpacing: 24,
                headingRowColor: WidgetStateProperty.all(
                  theme.colorScheme.surfaceContainerHighest,
                ),
                columns: const [
                  DataColumn(label: Text('Entidad')),
                  DataColumn(label: Text('Tipo')),
                  DataColumn(label: Text('Actividades'), numeric: true),
                  DataColumn(label: Text('Gastos'), numeric: true),
                  DataColumn(label: Text('Cumplimiento'), numeric: true),
                ],
                rows: breakdown.map((entity) {
                  return DataRow(
                    cells: [
                      DataCell(
                        InkWell(
                          onTap: onEntityTap != null
                              ? () => onEntityTap!(entity.entityId)
                              : null,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                _getEntityIcon(entity.entityType),
                                size: 16,
                                color: theme.colorScheme.primary,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                entity.entityName,
                                style: TextStyle(
                                  color: onEntityTap != null
                                      ? theme.colorScheme.primary
                                      : null,
                                  decoration: onEntityTap != null
                                      ? TextDecoration.underline
                                      : null,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      DataCell(Text(entity.entityType.displayName)),
                      DataCell(Text('${entity.activities}')),
                      DataCell(Text(CurrencyFormatter.format(entity.expenses, currencySymbol))),
                      DataCell(_ComplianceBadge(rate: entity.complianceRate)),
                    ],
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getEntityIcon(EntityType type) {
    switch (type) {
      case EntityType.platform:
        return Icons.public;
      case EntityType.union:
        return Icons.account_balance;
      case EntityType.association:
        return Icons.groups;
      case EntityType.field:
        return Icons.location_on;
    }
  }
}

class _ComplianceBadge extends StatelessWidget {
  const _ComplianceBadge({required this.rate});

  final double rate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final percent = (rate * 100).round();

    Color backgroundColor;
    Color textColor;

    if (rate >= 0.8) {
      backgroundColor = Colors.green.shade100;
      textColor = Colors.green.shade800;
    } else if (rate >= 0.5) {
      backgroundColor = Colors.orange.shade100;
      textColor = Colors.orange.shade800;
    } else {
      backgroundColor = Colors.red.shade100;
      textColor = Colors.red.shade800;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        '$percent%',
        style: theme.textTheme.labelSmall?.copyWith(
          color: textColor,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

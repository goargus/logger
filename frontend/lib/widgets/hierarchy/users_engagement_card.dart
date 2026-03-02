import 'package:flutter/material.dart';
import '../../models/engagement_report.dart';
import '../../models/users_report.dart';

/// Card widget showing user engagement with activity metrics
class UsersEngagementCard extends StatefulWidget {
  const UsersEngagementCard({
    super.key,
    required this.engagement,
    this.onUserTap,
    this.title = 'Usuarios',
    this.currentFilter,
    this.onFilterChange,
  });

  final EngagementResponse engagement;
  final void Function(String userId, String userName)? onUserTap;
  final String title;
  final EngagementFilter? currentFilter;
  final void Function(EngagementFilter filter)? onFilterChange;

  @override
  State<UsersEngagementCard> createState() => _UsersEngagementCardState();
}

class _UsersEngagementCardState extends State<UsersEngagementCard> {
  EngagementFilter _localFilter = EngagementFilter.all;

  EngagementFilter get _activeFilter => widget.currentFilter ?? _localFilter;

  List<EngagementUser> get _filteredUsers {
    switch (_activeFilter) {
      case EngagementFilter.all:
        return widget.engagement.users;
      case EngagementFilter.active:
        return widget.engagement.users
            .where((u) => u.activityCount > 0)
            .toList();
      case EngagementFilter.inactive:
        return widget.engagement.users
            .where((u) => u.activityCount == 0)
            .toList();
    }
  }

  void _onFilterChanged(EngagementFilter filter) {
    if (widget.onFilterChange != null) {
      widget.onFilterChange!(filter);
    } else {
      setState(() => _localFilter = filter);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (widget.engagement.users.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(
                Icons.people_outline,
                size: 48,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: 8),
              Text(
                'No hay datos de usuarios',
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
                Icon(Icons.people, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  widget.title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                _buildSummaryChips(theme),
              ],
            ),
            const SizedBox(height: 12),
            _buildFilterBar(theme),
            const SizedBox(height: 12),
            _buildUsersTable(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryChips(ThemeData theme) {
    final summary = widget.engagement.summary;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Chip(
          avatar: Icon(Icons.check, size: 16, color: Colors.green.shade700),
          label: Text('${summary.activeUsers} activos'),
          backgroundColor: Colors.green.shade50,
          visualDensity: VisualDensity.compact,
          padding: EdgeInsets.zero,
        ),
        const SizedBox(width: 8),
        Chip(
          avatar: Icon(Icons.remove_circle_outline,
              size: 16, color: Colors.orange.shade700),
          label: Text('${summary.inactiveUsers} inactivos'),
          backgroundColor: Colors.orange.shade50,
          visualDensity: VisualDensity.compact,
          padding: EdgeInsets.zero,
        ),
      ],
    );
  }

  Widget _buildFilterBar(ThemeData theme) {
    return Row(
      children: EngagementFilter.values.map((filter) {
        final isSelected = _activeFilter == filter;
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: FilterChip(
            label: Text(filter.label),
            selected: isSelected,
            onSelected: (_) => _onFilterChanged(filter),
            visualDensity: VisualDensity.compact,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildUsersTable(ThemeData theme) {
    final users = _filteredUsers;

    if (users.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: Text(
            'No hay usuarios en esta categoria',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: theme.dividerColor),
        borderRadius: BorderRadius.circular(8),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(
            theme.colorScheme.surfaceContainerHighest,
          ),
          dataRowMinHeight: 48,
          dataRowMaxHeight: 56,
          columnSpacing: 24,
          horizontalMargin: 16,
          columns: const [
            DataColumn(label: Text('Usuario')),
            DataColumn(label: Text('Entidad')),
            DataColumn(label: Text('Actividades'), numeric: true),
            DataColumn(label: Text('Ultima Actividad')),
            DataColumn(label: Text('Tendencia'), numeric: true),
          ],
          rows: users.map((user) {
            return DataRow(
              cells: [
                DataCell(
                  _buildUserCell(theme, user.name, user.userId),
                  onTap: widget.onUserTap != null
                      ? () => widget.onUserTap!(user.userId, user.name)
                      : null,
                ),
                DataCell(
                  Text(
                    user.entity,
                    style: theme.textTheme.bodySmall,
                  ),
                ),
                DataCell(
                  Text(
                    '${user.activityCount}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: user.activityCount > 0
                          ? Colors.green.shade700
                          : Colors.grey,
                    ),
                  ),
                ),
                DataCell(
                  Text(
                    _formatDate(user.lastActivityDate),
                    style: theme.textTheme.bodySmall,
                  ),
                ),
                DataCell(_buildTrendCell(theme, user.trend)),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildUserCell(ThemeData theme, String name, String userId) {
    final isClickable = widget.onUserTap != null;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        CircleAvatar(
          radius: 14,
          backgroundColor: theme.colorScheme.primaryContainer,
          child: Text(
            name.isNotEmpty ? name[0].toUpperCase() : '?',
            style: TextStyle(
              color: theme.colorScheme.onPrimaryContainer,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          name,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
            color: isClickable ? theme.colorScheme.primary : null,
            decoration: isClickable ? TextDecoration.underline : null,
          ),
        ),
        if (isClickable) ...[
          const SizedBox(width: 4),
          Icon(
            Icons.open_in_new,
            size: 14,
            color: theme.colorScheme.primary,
          ),
        ],
      ],
    );
  }

  Widget _buildTrendCell(ThemeData theme, double? trend) {
    if (trend == null) {
      return Text('-', style: theme.textTheme.bodySmall);
    }

    final isPositive = trend > 0;
    final isNeutral = trend == 0;
    final color = isPositive
        ? Colors.green.shade700
        : isNeutral
            ? Colors.grey.shade600
            : Colors.red.shade700;
    final icon = isPositive
        ? Icons.trending_up
        : isNeutral
            ? Icons.trending_flat
            : Icons.trending_down;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 4),
        Text(
          '${trend > 0 ? '+' : ''}${trend.toStringAsFixed(0)}%',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}

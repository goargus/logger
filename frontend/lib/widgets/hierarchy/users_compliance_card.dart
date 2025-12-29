import 'package:flutter/material.dart';
import '../../models/compliance_report.dart';

/// Card widget showing users who submitted vs not submitted activities
class UsersComplianceCard extends StatelessWidget {
  const UsersComplianceCard({
    super.key,
    required this.compliance,
    this.onUserTap,
    this.title = 'Usuarios',
  });

  final ComplianceResponse compliance;
  final void Function(String userId, String userName)? onUserTap;
  final String title;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (compliance.isEmpty) {
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
                  title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                _buildSummaryChips(theme),
              ],
            ),
            const SizedBox(height: 16),

            // Submitted users section
            if (compliance.submitted.isNotEmpty) ...[
              _buildSectionHeader(
                theme,
                icon: Icons.check_circle,
                label: 'Han reportado (${compliance.submitted.length})',
                color: Colors.green,
              ),
              const SizedBox(height: 8),
              _buildSubmittedUsersTable(theme),
              const SizedBox(height: 16),
            ],

            // Not submitted users section
            if (compliance.notSubmitted.isNotEmpty) ...[
              _buildSectionHeader(
                theme,
                icon: Icons.warning,
                label: 'Sin reportar (${compliance.notSubmitted.length})',
                color: Colors.orange,
              ),
              const SizedBox(height: 8),
              _buildNotSubmittedUsersTable(theme),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryChips(ThemeData theme) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Chip(
          avatar: Icon(Icons.check, size: 16, color: Colors.green.shade700),
          label: Text('${compliance.submitted.length}'),
          backgroundColor: Colors.green.shade50,
          visualDensity: VisualDensity.compact,
          padding: EdgeInsets.zero,
        ),
        const SizedBox(width: 8),
        Chip(
          avatar: Icon(Icons.close, size: 16, color: Colors.orange.shade700),
          label: Text('${compliance.notSubmitted.length}'),
          backgroundColor: Colors.orange.shade50,
          visualDensity: VisualDensity.compact,
          padding: EdgeInsets.zero,
        ),
      ],
    );
  }

  Widget _buildSectionHeader(
    ThemeData theme, {
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Text(
          label,
          style: theme.textTheme.titleSmall?.copyWith(
            color: color,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildSubmittedUsersTable(ThemeData theme) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: theme.dividerColor),
        borderRadius: BorderRadius.circular(8),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(
            Colors.green.shade50,
          ),
          dataRowMinHeight: 48,
          dataRowMaxHeight: 56,
          columnSpacing: 24,
          horizontalMargin: 16,
          columns: const [
            DataColumn(label: Text('Usuario')),
            DataColumn(label: Text('Actividades'), numeric: true),
            DataColumn(label: Text('Ultima Actividad')),
          ],
          rows: compliance.submitted.map((user) {
            return DataRow(
              cells: [
                DataCell(
                  _buildUserCell(theme, user.name, user.userId),
                  onTap: onUserTap != null
                      ? () => onUserTap!(user.userId, user.name)
                      : null,
                ),
                DataCell(
                  Text(
                    '${user.count}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.green.shade700,
                    ),
                  ),
                ),
                DataCell(
                  Text(
                    _formatDate(user.lastActivity),
                    style: theme.textTheme.bodySmall,
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildNotSubmittedUsersTable(ThemeData theme) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: theme.dividerColor),
        borderRadius: BorderRadius.circular(8),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(
            Colors.orange.shade50,
          ),
          dataRowMinHeight: 48,
          dataRowMaxHeight: 56,
          columnSpacing: 24,
          horizontalMargin: 16,
          columns: const [
            DataColumn(label: Text('Usuario')),
            DataColumn(label: Text('Entidad')),
            DataColumn(label: Text('Roles')),
          ],
          rows: compliance.notSubmitted.map((user) {
            return DataRow(
              cells: [
                DataCell(
                  _buildUserCell(theme, user.name, user.userId),
                  onTap: onUserTap != null
                      ? () => onUserTap!(user.userId, user.name)
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
                    user.roles.join(', '),
                    style: theme.textTheme.bodySmall,
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildUserCell(ThemeData theme, String name, String userId) {
    final isClickable = onUserTap != null;

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

  String _formatDate(String dateStr) {
    if (dateStr.isEmpty) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}

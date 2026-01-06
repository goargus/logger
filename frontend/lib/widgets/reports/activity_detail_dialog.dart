import 'package:flutter/material.dart';
import '../../models/user_activities.dart';
import '../../utils/currency_formatter.dart';

/// Dialog to display full activity details
class ActivityDetailDialog extends StatelessWidget {
  const ActivityDetailDialog({
    super.key,
    required this.activity,
    this.userName,
    this.currencySymbol = '\$',
  });

  final UserActivity activity;
  final String? userName;
  final String currencySymbol;

  static Future<void> show(
    BuildContext context, {
    required UserActivity activity,
    String? userName,
    String currencySymbol = '\$',
  }) {
    return showDialog(
      context: context,
      builder: (context) => ActivityDetailDialog(
        activity: activity,
        userName: userName,
        currencySymbol: currencySymbol,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AlertDialog(
      title: Row(
        children: [
          CircleAvatar(
            backgroundColor: theme.colorScheme.primaryContainer,
            child: Icon(
              Icons.event_note,
              color: theme.colorScheme.onPrimaryContainer,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              activity.typeName,
              style: theme.textTheme.titleLarge,
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status chip
            _buildStatusChip(theme),
            const SizedBox(height: 16),

            // Date
            _buildDetailRow(
              theme,
              icon: Icons.calendar_today,
              label: 'Fecha',
              value: _formatDate(activity.date),
            ),
            const SizedBox(height: 12),

            // Created at
            _buildDetailRow(
              theme,
              icon: Icons.access_time,
              label: 'Registrado',
              value: _formatDateTime(activity.createdAt),
            ),
            const SizedBox(height: 12),

            // User (if provided)
            if (userName != null) ...[
              _buildDetailRow(
                theme,
                icon: Icons.person,
                label: 'Usuario',
                value: userName!,
              ),
              const SizedBox(height: 12),
            ],

            // Expense
            if (activity.hasExpense) ...[
              _buildDetailRow(
                theme,
                icon: Icons.attach_money,
                label: 'Gasto',
                value: CurrencyFormatter.formatString(activity.expenseAmount, currencySymbol),
                valueColor: theme.colorScheme.tertiary,
              ),
              const SizedBox(height: 12),
            ],

            // Description
            if (activity.description != null &&
                activity.description!.isNotEmpty) ...[
              const Divider(),
              const SizedBox(height: 8),
              Text(
                'Descripción',
                style: theme.textTheme.labelLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  activity.description!,
                  style: theme.textTheme.bodyMedium,
                ),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cerrar'),
        ),
      ],
    );
  }

  Widget _buildStatusChip(ThemeData theme) {
    Color backgroundColor;
    Color textColor;
    IconData icon;

    switch (activity.status.toLowerCase()) {
      case 'active':
        backgroundColor = Colors.green.shade50;
        textColor = Colors.green.shade700;
        icon = Icons.edit;
        break;
      case 'locked':
        backgroundColor = Colors.orange.shade50;
        textColor = Colors.orange.shade700;
        icon = Icons.lock;
        break;
      default:
        backgroundColor = Colors.grey.shade100;
        textColor = Colors.grey.shade700;
        icon = Icons.help_outline;
    }

    return Chip(
      avatar: Icon(icon, size: 16, color: textColor),
      label: Text(
        _formatStatus(activity.status),
        style: TextStyle(color: textColor),
      ),
      backgroundColor: backgroundColor,
      visualDensity: VisualDensity.compact,
    );
  }

  Widget _buildDetailRow(
    ThemeData theme, {
    required IconData icon,
    required String label,
    required String value,
    Color? valueColor,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: theme.colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: valueColor,
            ),
          ),
        ),
      ],
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final months = [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Sep',
        'Oct',
        'Nov',
        'Dic'
      ];
      return '${date.day} ${months[date.month - 1]} ${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  String _formatDateTime(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateStr;
    }
  }

  String _formatStatus(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Activo';
      case 'locked':
        return 'Bloqueado';
      default:
        return status;
    }
  }
}

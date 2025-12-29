import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../services/activity.dart';
import '../../core/api_client.dart';
import '../../core/errors/app_exception.dart';

class DeleteActivityDialog extends StatefulWidget {
  final Map<String, dynamic> activity;
  final String baseUrl;
  final Future<String?> Function() getAccessToken;
  final VoidCallback? onRequireLogin;

  const DeleteActivityDialog({
    super.key,
    required this.activity,
    required this.baseUrl,
    required this.getAccessToken,
    this.onRequireLogin,
  });

  @override
  State<DeleteActivityDialog> createState() => _DeleteActivityDialogState();
}

class _DeleteActivityDialogState extends State<DeleteActivityDialog> {
  bool _deleting = false;
  String? _error;

  String get _activityId => widget.activity['id'] ?? '';

  String get _activityTypeName =>
      widget.activity['activityTypeName'] ?? 'Actividad';

  String get _activityDate {
    final dateStr = widget.activity['activityDate'] as String?;
    if (dateStr == null) return 'Fecha desconocida';
    final date = DateTime.tryParse(dateStr);
    if (date == null) return dateStr;
    return DateFormat.yMMMMd('es').format(date);
  }

  Future<void> _delete() async {
    final token = await widget.getAccessToken();
    if (token == null || token.isEmpty) {
      widget.onRequireLogin?.call();
      setState(() => _error = 'No estás autenticado.');
      return;
    }

    setState(() {
      _deleting = true;
      _error = null;
    });

    try {
      final apiClient = ApiClient(
        baseUrl: widget.baseUrl,
        getAccessToken: () async => token,
      );
      final service = ActivityService(apiClient: apiClient);

      await service.deleteActivity(_activityId);

      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on AuthException catch (e) {
      final isForbidden = e.technicalMessage?.contains('403') ?? false;
      final isUnauthorized = e.technicalMessage?.contains('401') ?? false;

      if (isUnauthorized) {
        widget.onRequireLogin?.call();
        setState(() =>
            _error = 'Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (isForbidden) {
        setState(() =>
            _error = 'Esta actividad está bloqueada y no se puede eliminar.');
      } else {
        setState(() => _error = e.userMessage);
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AlertDialog(
      icon: Icon(
        Icons.warning_amber_rounded,
        size: 48,
        color: theme.colorScheme.error,
      ),
      title: const Text('Eliminar actividad'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '¿Estás seguro que deseas eliminar esta actividad?',
            style: theme.textTheme.bodyLarge,
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.category_outlined,
                      size: 16,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _activityTypeName,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today_outlined,
                      size: 16,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _activityDate,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Esta acción no se puede deshacer.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.error,
              fontWeight: FontWeight.w500,
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: theme.colorScheme.error.withValues(alpha: 0.08),
                border: Border.all(
                    color: theme.colorScheme.error.withValues(alpha: 0.3)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _error!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.error,
                ),
              ),
            ),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: _deleting ? null : () => Navigator.of(context).pop(false),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: _deleting ? null : _delete,
          style: FilledButton.styleFrom(
            backgroundColor: theme.colorScheme.error,
            foregroundColor: theme.colorScheme.onError,
          ),
          child: _deleting
              ? const SizedBox(
                  height: 16,
                  width: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Eliminar'),
        ),
      ],
    );
  }
}

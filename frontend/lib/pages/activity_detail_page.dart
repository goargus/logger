import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/activity.dart';
import '../providers/activities.dart';
import '../providers/auth.dart';
import '../router.dart';
import '../config/api_config.dart';
import '../auth/auth_utils.dart';
import '../core/snackbars.dart';
import '../widgets/dialogs/activity_form_dialog.dart';
import '../widgets/dialogs/delete_activity_dialog.dart';

/// Content-only widget for activity detail - shell is handled by AppShell via router
class ActivityDetailContent extends ConsumerStatefulWidget {
  final String activityId;

  const ActivityDetailContent({super.key, required this.activityId});

  @override
  ConsumerState<ActivityDetailContent> createState() =>
      _ActivityDetailContentState();
}

class _ActivityDetailContentState extends ConsumerState<ActivityDetailContent> {
  Activity? _activity;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadActivity();
  }

  Future<void> _loadActivity() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final service = ref.read(activityServiceProvider);
      final data = await service.getActivityById(widget.activityId);
      if (mounted) {
        setState(() {
          _activity = Activity.fromApi(data);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _showEditDialog() async {
    if (_activity == null) return;

    final activityData = {
      'id': _activity!.id,
      'activityTypeId': _activity!.activityTypeId,
      'activityDate': _activity!.date.toIso8601String(),
      'description': _activity!.description,
      'hasExpense': _activity!.hasExpense,
      'expenseAmount': _activity!.expense.toString(),
    };

    final result = await showDialog<Map<String, dynamic>?>(
      context: context,
      barrierDismissible: false,
      builder: (_) => ActivityFormDialog(
        baseUrl: ApiConfig.baseUrl,
        existingActivity: activityData,
        getAccessToken: () async {
          return await AuthUtils.getAccessTokenEnsured(ref) ?? '';
        },
        onRequireLogin: () {
          Navigator.of(context).pop();
          ref.read(authNotifierProvider.notifier).login();
        },
      ),
    );

    if (result != null && mounted) {
      Snackbars.showSuccess(context, 'Actividad actualizada');
      _loadActivity();
    }
  }

  Future<void> _showDeleteDialog() async {
    if (_activity == null) return;

    final activityData = {
      'id': _activity!.id,
      'activityTypeName': _activity!.category,
      'activityDate': _activity!.date.toIso8601String(),
    };

    final deleted = await showDialog<bool?>(
      context: context,
      barrierDismissible: false,
      builder: (_) => DeleteActivityDialog(
        activity: activityData,
        baseUrl: ApiConfig.baseUrl,
        getAccessToken: () async {
          return await AuthUtils.getAccessTokenEnsured(ref) ?? '';
        },
        onRequireLogin: () {
          Navigator.of(context).pop();
          ref.read(authNotifierProvider.notifier).login();
        },
      ),
    );

    if (deleted == true && mounted) {
      Snackbars.showSuccess(context, 'Actividad eliminada');
      context.go(AppRoutes.activities);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Back button and title
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => context.go(AppRoutes.activities),
                tooltip: 'Volver',
              ),
              const SizedBox(width: 8),
              const Text(
                'Detalle de Actividad',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(40.0),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_error != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(40.0),
                child: Column(
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 48,
                      color: Colors.red.shade300,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Error al cargar la actividad',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.red.shade700,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _error!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey.shade600,
                          ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _loadActivity,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
            )
          else if (_activity != null)
            _buildActivityDetails(_activity!),
        ],
      ),
    );
  }

  Widget _buildActivityDetails(Activity activity) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status badge and actions at the top
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Informacion de la Actividad',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                Row(
                  children: [
                    _buildStatusBadge(activity),
                    if (!activity.locked) ...[
                      const SizedBox(width: 12),
                      IconButton(
                        icon: const Icon(Icons.edit_outlined),
                        onPressed: _showEditDialog,
                        tooltip: 'Editar',
                        style: IconButton.styleFrom(
                          foregroundColor: Theme.of(context).primaryColor,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outlined),
                        onPressed: _showDeleteDialog,
                        tooltip: 'Eliminar',
                        style: IconButton.styleFrom(
                          foregroundColor: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
            const Divider(height: 32),

            _buildDetailRow(
              context,
              'Tipo de Actividad',
              activity.category,
              Icons.category,
            ),
            _buildDetailRow(
              context,
              'Fecha',
              _formatDateLong(activity.date),
              Icons.calendar_today,
            ),
            _buildDetailRow(
              context,
              'Descripcion',
              activity.description.isNotEmpty
                  ? activity.description
                  : 'Sin descripcion',
              Icons.description,
              isDescription: true,
            ),
            const Divider(height: 32),

            // Expense section
            Text(
              'Gastos',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 16),
            _buildDetailRow(
              context,
              'Tiene Gasto',
              activity.hasExpense ? 'Si' : 'No',
              Icons.receipt,
            ),
            if (activity.hasExpense)
              _buildDetailRow(
                context,
                'Monto',
                'L.${activity.expense.toStringAsFixed(2)}',
                Icons.attach_money,
                isHighlight: true,
              ),

            if (activity.reportingPeriodName != null) ...[
              const Divider(height: 32),
              Text(
                'Periodo de Reporte',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 16),
              _buildDetailRow(
                context,
                'Periodo',
                activity.reportingPeriodName!,
                Icons.date_range,
              ),
            ],

            if (activity.createdAt != null) ...[
              const Divider(height: 32),
              Text(
                'Metadatos',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade600,
                    ),
              ),
              const SizedBox(height: 16),
              _buildDetailRow(
                context,
                'Creado',
                _formatDateTimeLong(activity.createdAt!),
                Icons.access_time,
                isSubtle: true,
              ),
              if (activity.updatedAt != null)
                _buildDetailRow(
                  context,
                  'Actualizado',
                  _formatDateTimeLong(activity.updatedAt!),
                  Icons.update,
                  isSubtle: true,
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(
    BuildContext context,
    String label,
    String value,
    IconData icon, {
    bool isDescription = false,
    bool isHighlight = false,
    bool isSubtle = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: isDescription
            ? CrossAxisAlignment.start
            : CrossAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 20,
            color: isSubtle ? Colors.grey.shade400 : Colors.grey.shade600,
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: isSubtle ? Colors.grey.shade500 : Colors.grey.shade700,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontWeight: isHighlight ? FontWeight.w600 : FontWeight.normal,
                color: isHighlight
                    ? Theme.of(context).primaryColor
                    : isSubtle
                        ? Colors.grey.shade500
                        : Colors.black87,
                fontSize: isHighlight ? 16 : 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(Activity activity) {
    if (activity.locked) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.lock, size: 16, color: Colors.grey.shade600),
            const SizedBox(width: 6),
            Text(
              'Bloqueado',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: Colors.grey.shade700,
              ),
            ),
          ],
        ),
      );
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle, size: 16, color: Colors.green.shade700),
          const SizedBox(width: 6),
          Text(
            'Activo',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Colors.green.shade700,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDateLong(DateTime date) {
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre'
    ];
    return '${date.day} de ${months[date.month - 1]} de ${date.year}';
  }

  String _formatDateTimeLong(DateTime date) {
    final dateStr = _formatDateLong(date);
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$dateStr a las $hour:$minute';
  }
}

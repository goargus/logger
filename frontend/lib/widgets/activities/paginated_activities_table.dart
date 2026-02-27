import 'package:flutter/material.dart';
import '../../models/activity.dart';

class PaginatedActivitiesTable extends StatelessWidget {
  final List<Activity> items;
  final int page;
  final int totalPages;
  final int total;
  final Function(int) onPageChange;
  final Function(Activity) onRowTap;
  final Function(Activity)? onEdit;
  final Function(Activity)? onDelete;
  final int? sortColumnIndex;
  final bool sortAscending;
  final Function(int, bool)? onSort;

  const PaginatedActivitiesTable({
    super.key,
    required this.items,
    required this.page,
    required this.totalPages,
    required this.total,
    required this.onPageChange,
    required this.onRowTap,
    this.onEdit,
    this.onDelete,
    this.sortColumnIndex,
    this.sortAscending = false,
    this.onSort,
  });

  bool get _showActions => onEdit != null || onDelete != null;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Results count
            Text(
              '$total actividad${total == 1 ? '' : 'es'} encontrada${total == 1 ? '' : 's'}',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade600,
                  ),
            ),
            const SizedBox(height: 16),

            // Table
            if (items.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(40),
                  child: Column(
                    children: [
                      Icon(
                        Icons.inbox_outlined,
                        size: 48,
                        color: Colors.grey.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No hay actividades para mostrar',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: Colors.grey.shade600,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Intenta ajustar los filtros o crear una nueva actividad',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey.shade500,
                            ),
                      ),
                    ],
                  ),
                ),
              )
            else
              LayoutBuilder(
                builder: (context, constraints) {
                  return SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: ConstrainedBox(
                      constraints:
                          BoxConstraints(minWidth: constraints.maxWidth),
                      child: DataTable(
                        showCheckboxColumn: false,
                        sortColumnIndex: sortColumnIndex,
                        sortAscending: sortAscending,
                        headingRowColor: WidgetStateProperty.all(
                          Colors.grey.shade50,
                        ),
                        columns: [
                          DataColumn(
                            label: const Text(
                              'Fecha',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                            onSort: onSort,
                          ),
                          DataColumn(
                            label: const Text(
                              'Tipo',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                            onSort: onSort,
                          ),
                          DataColumn(
                            label: const Text(
                              'Descripcion',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                            onSort: onSort,
                          ),
                          DataColumn(
                            label: const Text(
                              'Gasto',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                            numeric: true,
                            onSort: onSort,
                          ),
                          const DataColumn(
                            label: Text(
                              'Estado',
                              style: TextStyle(fontWeight: FontWeight.w600),
                            ),
                          ),
                          if (_showActions)
                            const DataColumn(
                              label: Text(
                                'Acciones',
                                style: TextStyle(fontWeight: FontWeight.w600),
                              ),
                            ),
                        ],
                        rows: items.map((activity) {
                          return DataRow(
                            onSelectChanged: (_) => onRowTap(activity),
                            cells: [
                              DataCell(Text(_formatDate(activity.date))),
                              DataCell(
                                ConstrainedBox(
                                  constraints:
                                      const BoxConstraints(maxWidth: 150),
                                  child: Text(
                                    activity.category,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                              DataCell(
                                ConstrainedBox(
                                  constraints:
                                      const BoxConstraints(maxWidth: 250),
                                  child: Text(
                                    activity.description.isNotEmpty
                                        ? activity.description
                                        : '-',
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                              DataCell(
                                Text(
                                  activity.hasExpense
                                      ? 'L.${activity.expense.toStringAsFixed(2)}'
                                      : '-',
                                  style: activity.hasExpense
                                      ? const TextStyle(
                                          fontWeight: FontWeight.w500)
                                      : null,
                                ),
                              ),
                              DataCell(_buildStatusBadge(activity)),
                              if (_showActions)
                                DataCell(
                                  _buildActionButtons(context, activity),
                                ),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                  );
                },
              ),

            if (items.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),

              // Pagination controls
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.first_page),
                    onPressed: page > 1 ? () => onPageChange(1) : null,
                    tooltip: 'Primera pagina',
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_left),
                    onPressed: page > 1 ? () => onPageChange(page - 1) : null,
                    tooltip: 'Pagina anterior',
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'Pagina $page de $totalPages',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right),
                    onPressed:
                        page < totalPages ? () => onPageChange(page + 1) : null,
                    tooltip: 'Siguiente pagina',
                  ),
                  IconButton(
                    icon: const Icon(Icons.last_page),
                    onPressed: page < totalPages
                        ? () => onPageChange(totalPages)
                        : null,
                    tooltip: 'Ultima pagina',
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    const months = [
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
  }

  Widget _buildActionButtons(BuildContext context, Activity activity) {
    final theme = Theme.of(context);
    final isLocked = activity.locked;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (onEdit != null)
          IconButton(
            icon: Icon(
              Icons.edit_outlined,
              size: 18,
              color: isLocked ? Colors.grey.shade400 : theme.primaryColor,
            ),
            onPressed: isLocked ? null : () => onEdit!(activity),
            tooltip: isLocked ? 'Bloqueado' : 'Editar',
            padding: const EdgeInsets.all(4),
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
        if (onDelete != null)
          IconButton(
            icon: Icon(
              Icons.delete_outlined,
              size: 18,
              color: isLocked ? Colors.grey.shade400 : theme.colorScheme.error,
            ),
            onPressed: isLocked ? null : () => onDelete!(activity),
            tooltip: isLocked ? 'Bloqueado' : 'Eliminar',
            padding: const EdgeInsets.all(4),
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
      ],
    );
  }

  Widget _buildStatusBadge(Activity activity) {
    if (activity.locked) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.lock, size: 12, color: Colors.grey.shade600),
            const SizedBox(width: 4),
            Text(
              'Bloqueado',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
          ],
        ),
      );
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.check_circle, size: 12, color: Colors.green.shade700),
          const SizedBox(width: 4),
          Text(
            'Activo',
            style: TextStyle(fontSize: 12, color: Colors.green.shade700),
          ),
        ],
      ),
    );
  }
}

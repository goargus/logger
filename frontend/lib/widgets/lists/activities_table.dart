import 'package:flutter/material.dart';
import '../../models/activity.dart';

class ActivitiesTable extends StatelessWidget {
  final List<Activity> items;
  final Function(Activity)? onEdit;
  final Function(Activity)? onDelete;

  const ActivitiesTable({
    super.key,
    required this.items,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final hdrStyle = Theme.of(context).textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w600,
        );

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Actividades Recientes',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 16),
          const Divider(height: 1),
          LayoutBuilder(
            builder: (context, constraints) {
              final availableWidth = constraints.maxWidth;

              return SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minWidth: availableWidth,
                  ),
                  child: DataTable(
                    columnSpacing: 20,
                    headingRowHeight: 44,
                    headingTextStyle: hdrStyle,
                    dataRowMinHeight: 48,
                    dataRowMaxHeight: 52,
                    horizontalMargin: 0,
                    columns: [
                      DataColumn(
                        label: SizedBox(
                          width: availableWidth * 0.15,
                          child: const Text('Fecha'),
                        ),
                      ),
                      DataColumn(
                        label: SizedBox(
                          width: availableWidth * 0.20,
                          child: const Text('Categoría'),
                        ),
                      ),
                      DataColumn(
                        label: SizedBox(
                          width: availableWidth * 0.35,
                          child: const Text('Descripción'),
                        ),
                      ),
                      DataColumn(
                        label: SizedBox(
                          width: availableWidth * 0.15,
                          child: const Text('Gasto'),
                        ),
                      ),
                      DataColumn(
                        label: SizedBox(
                          width: availableWidth * 0.12,
                          child: const Text('Acciones'),
                        ),
                      ),
                    ],
                    rows: items.map((a) {
                      return DataRow(cells: [
                        DataCell(
                          SizedBox(
                            width: availableWidth * 0.15,
                            child: Text(
                                '${a.date.day} ${_month(a.date.month)} ${a.date.year}'),
                          ),
                        ),
                        DataCell(
                          SizedBox(
                            width: availableWidth * 0.20,
                            child: Text(a.category),
                          ),
                        ),
                        DataCell(
                          SizedBox(
                            width: availableWidth * 0.35,
                            child: Text(a.description),
                          ),
                        ),
                        DataCell(
                          SizedBox(
                            width: availableWidth * 0.15,
                            child: Text('L.${a.expense.toStringAsFixed(2)}'),
                          ),
                        ),
                        DataCell(
                          SizedBox(
                            width: availableWidth * 0.12,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton.filledTonal(
                                  padding: const EdgeInsets.all(8),
                                  constraints: const BoxConstraints(
                                    minWidth: 36,
                                    minHeight: 36,
                                  ),
                                  onPressed: a.locked
                                      ? null
                                      : (onEdit != null
                                          ? () => onEdit!(a)
                                          : null),
                                  tooltip: a.locked ? 'Bloqueado' : 'Editar',
                                  icon: Icon(
                                    Icons.edit,
                                    size: 16,
                                    color:
                                        a.locked ? Colors.grey.shade400 : null,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                IconButton.filledTonal(
                                  padding: const EdgeInsets.all(8),
                                  constraints: const BoxConstraints(
                                    minWidth: 36,
                                    minHeight: 36,
                                  ),
                                  onPressed: a.locked
                                      ? null
                                      : (onDelete != null
                                          ? () => onDelete!(a)
                                          : null),
                                  tooltip: a.locked ? 'Bloqueado' : 'Eliminar',
                                  icon: Icon(
                                    Icons.delete_outline,
                                    size: 16,
                                    color: a.locked
                                        ? Colors.grey.shade400
                                        : Theme.of(context).colorScheme.error,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ]);
                    }).toList(),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  String _month(int m) {
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
    return months[m - 1];
  }
}

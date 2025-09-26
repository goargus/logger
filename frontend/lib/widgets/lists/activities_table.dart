import 'package:flutter/material.dart';
import '../../models/activity.dart';

class ActivitiesTable extends StatelessWidget {
  final List<Activity> items;
  const ActivitiesTable({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    final hdrStyle = Theme.of(context).textTheme.titleMedium;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          columnSpacing: 28,
          headingRowHeight: 48,
          headingTextStyle: hdrStyle,
          columns: const [
            DataColumn(label: Text('Fecha')),
            DataColumn(label: Text('Categoría')),
            DataColumn(label: Text('Descripción')),
            DataColumn(label: Text('Gasto')),
            DataColumn(label: Text('Acciones')),
          ],
          rows: items.map((a) {
            return DataRow(cells: [
              DataCell(
                  Text('${a.date.day} ${_month(a.date.month)} ${a.date.year}')),
              DataCell(Text(a.category)),
              DataCell(Text(a.description)),
              DataCell(Text('L.${a.expense.toStringAsFixed(2)}')),
              DataCell(Row(
                children: [
                  IconButton.filledTonal(
                    onPressed: () {},
                    icon: const Icon(Icons.edit, size: 18),
                  ),
                  const SizedBox(width: 6),
                  IconButton.filledTonal(
                    onPressed: () {},
                    icon: const Icon(Icons.delete_outline, size: 18),
                  ),
                ],
              )),
            ]);
          }).toList(),
        ),
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

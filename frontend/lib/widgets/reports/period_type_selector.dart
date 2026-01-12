import 'package:flutter/material.dart';
import '../../models/report_period_type.dart';

class PeriodTypeSelector extends StatelessWidget {
  final ReportPeriodType selectedType;
  final ValueChanged<ReportPeriodType> onTypeChanged;

  const PeriodTypeSelector({
    super.key,
    required this.selectedType,
    required this.onTypeChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;

    if (isMobile) {
      return SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: ReportPeriodType.values.map((type) {
            final isSelected = type == selectedType;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(
                  type.displayName,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight:
                        isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                selected: isSelected,
                onSelected: (_) => onTypeChanged(type),
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(horizontal: 8),
              ),
            );
          }).toList(),
        ),
      );
    }

    return SegmentedButton<ReportPeriodType>(
      segments: ReportPeriodType.values.map((type) {
        return ButtonSegment<ReportPeriodType>(
          value: type,
          label: Text(
            type.displayName,
            style: const TextStyle(fontSize: 12),
          ),
        );
      }).toList(),
      selected: {selectedType},
      onSelectionChanged: (Set<ReportPeriodType> selection) {
        onTypeChanged(selection.first);
      },
      style: ButtonStyle(
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        visualDensity: VisualDensity.compact,
      ),
    );
  }
}

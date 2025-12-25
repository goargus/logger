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

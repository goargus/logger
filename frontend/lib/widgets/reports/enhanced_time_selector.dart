import 'package:flutter/material.dart';
import '../../models/report_period_type.dart';

class EnhancedTimeSelector extends StatelessWidget {
  final ReportPeriodType periodType;
  final int year;
  final int periodIndex;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  const EnhancedTimeSelector({
    super.key,
    required this.periodType,
    required this.year,
    required this.periodIndex,
    required this.onPrevious,
    required this.onNext,
  });

  static const _monthNames = [
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
    'Diciembre',
  ];

  String _formatPeriodLabel() {
    switch (periodType) {
      case ReportPeriodType.monthly:
        return '${_monthNames[periodIndex - 1]} $year';
      case ReportPeriodType.quarterly:
        return 'T$periodIndex $year';
      case ReportPeriodType.biannual:
        return periodIndex == 1
            ? 'Primer Semestre $year'
            : 'Segundo Semestre $year';
      case ReportPeriodType.annual:
        return year.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            'Período: ${_formatPeriodLabel()}',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back_ios, size: 18),
              onPressed: onPrevious,
              tooltip: 'Período anterior',
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.arrow_forward_ios, size: 18),
              onPressed: onNext,
              tooltip: 'Período siguiente',
            ),
          ],
        ),
      ],
    );
  }
}

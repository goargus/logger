import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class TimeSelector extends StatelessWidget {
  final DateTime periodStart;
  final DateTime periodEnd;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  const TimeSelector({
    super.key,
    required this.periodStart,
    required this.periodEnd,
    required this.onPrevious,
    required this.onNext,
  });

  String _formatPeriod() {
    final startDay = periodStart.day;
    final endDay = periodEnd.day;
    final monthName = DateFormat('MMM', 'es').format(periodStart);
    final year = periodStart.year;

    return '$monthName $startDay-$endDay, $year';
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Período: ${_formatPeriod()}',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
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

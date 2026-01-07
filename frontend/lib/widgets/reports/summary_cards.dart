import 'package:flutter/material.dart';
import '../../utils/currency_formatter.dart';

class SummaryCards extends StatelessWidget {
  final int activitiesCount;
  final double expenses;
  final bool isReported;
  final String currencySymbol;

  const SummaryCards({
    super.key,
    required this.activitiesCount,
    required this.expenses,
    required this.isReported,
    this.currencySymbol = '\$',
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _SummaryCard(
            title: 'Actividades',
            value: activitiesCount.toString(),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _SummaryCard(
            title: 'Gastos',
            value: CurrencyFormatter.format(expenses, currencySymbol),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _SummaryCard(
            title: 'Reportado',
            value: isReported ? '✓' : '✗',
            valueColor: isReported ? Colors.green : Colors.orange,
          ),
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String title;
  final String value;
  final Color? valueColor;

  const _SummaryCard({
    required this.title,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w700,
                color: valueColor ?? Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

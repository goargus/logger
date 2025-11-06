import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/layout_constants.dart';

class MonthHeaderPill extends StatelessWidget {
  const MonthHeaderPill({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          'Actividades en el Mes',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
        ),
        const SizedBox(width: LayoutConstants.spacing12),
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: LayoutConstants.spacing12,
            vertical: LayoutConstants.spacing6,
          ),
          decoration: BoxDecoration(
            color: const Color(0xFFF5A623),
            borderRadius: BorderRadius.circular(LayoutConstants.borderRadius8),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.calendar_today,
                size: LayoutConstants.iconSizeSmall,
                color: Colors.white,
              ),
              const SizedBox(width: LayoutConstants.spacing6),
              Text(
                DateFormat('MMMM yyyy', 'es').format(DateTime.now()),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

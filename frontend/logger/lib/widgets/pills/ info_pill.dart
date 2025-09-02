import 'package:flutter/material.dart';

class InfoPill extends StatelessWidget {
  final String label;
  final IconData? icon;
  const InfoPill({super.key, required this.label, this.icon});

  @override
  Widget build(BuildContext context) {
    final bg = const Color(0xFFF1EEFF);
    final bor = const Color(0xFFE2DCF9);
    final color = Theme.of(context).colorScheme.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: bor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 6),
          ],
          Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

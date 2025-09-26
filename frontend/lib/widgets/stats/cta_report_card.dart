import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class CtaReportCard extends StatelessWidget {
  final int reports;
  final VoidCallback onTap;

  const CtaReportCard({super.key, required this.reports, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTheme.radius),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppTheme.primary,
          borderRadius: BorderRadius.circular(AppTheme.radius),
        ),
        child: Row(
          children: [
            const Icon(Icons.description, color: Colors.white, size: 28),
            const SizedBox(width: 12),
            Text(
              '$reports',
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w800),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text('Ver Mis Reportes',
                  style: TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w700)),
            ),
            const Icon(Icons.chevron_right, color: Colors.white),
          ],
        ),
      ),
    );
  }
}

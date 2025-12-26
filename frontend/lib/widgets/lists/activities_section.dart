import 'package:flutter/material.dart';

import '../../core/layout_constants.dart';
import '../../models/activity.dart';
import 'activities_table.dart';

class ActivitiesSection extends StatelessWidget {
  final bool isLoading;
  final bool isAuthenticated;
  final List<Activity> activities;
  final VoidCallback onRefresh;
  final Function(Activity)? onEdit;
  final Function(Activity)? onDelete;

  const ActivitiesSection({
    super.key,
    required this.isLoading,
    required this.isAuthenticated,
    required this.activities,
    required this.onRefresh,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (activities.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(LayoutConstants.spacing32),
          child: Column(
            children: [
              const Icon(
                Icons.info_outline,
                size: LayoutConstants.iconSizeLarge,
                color: Colors.grey,
              ),
              const SizedBox(height: LayoutConstants.spacing8),
              Text(
                'No hay actividades recientes',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: LayoutConstants.spacing4),
              Text(
                isAuthenticated
                    ? 'Agrega tu primera actividad para verla aquí'
                    : 'Inicia sesión para ver tus actividades',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return ActivitiesTable(
      items: activities,
      onEdit: onEdit,
      onDelete: onDelete,
    );
  }
}

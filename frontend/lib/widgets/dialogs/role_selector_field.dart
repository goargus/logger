import 'package:flutter/material.dart';

import '../../core/validators.dart';
import '../../models/user_role_assignment.dart';

class RoleSelectorField extends StatelessWidget {
  final AsyncSnapshot<List<UserRoleAssignment>> snapshot;
  final ThemeData theme;
  final bool submitting;
  final UserRoleAssignment? selectedRole;
  final VoidCallback onRetry;
  final ValueChanged<UserRoleAssignment?> onRoleChanged;
  final ValueChanged<UserRoleAssignment> onAutoSelect;

  const RoleSelectorField({
    super.key,
    required this.snapshot,
    required this.theme,
    required this.submitting,
    required this.selectedRole,
    required this.onRetry,
    required this.onRoleChanged,
    required this.onAutoSelect,
  });

  @override
  Widget build(BuildContext context) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 10),
            Text('Cargando roles...'),
          ],
        ),
      );
    }

    if (snapshot.hasError) {
      final err = snapshot.error?.toString() ?? 'Error';
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Error al cargar los roles: $err',
            style: theme.textTheme.bodyMedium
                ?.copyWith(color: theme.colorScheme.error),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: submitting ? null : onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Reintentar'),
          ),
        ],
      );
    }

    final roles = snapshot.data ?? const <UserRoleAssignment>[];
    final activeRoles = roles.where((r) => r.isActive).toList();

    if (activeRoles.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'No tienes roles asignados.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: submitting ? null : onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Reintentar'),
          ),
        ],
      );
    }

    if (activeRoles.length == 1 && selectedRole == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        onAutoSelect(activeRoles.first);
      });
    }

    if (activeRoles.length == 1) {
      final role = activeRoles.first;
      return FormField<UserRoleAssignment>(
        initialValue: selectedRole ?? role,
        validator: (v) => Validators.requiredField(
          v,
          fieldName: 'El rol',
        ),
        builder: (field) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                decoration: BoxDecoration(
                  border: Border.all(color: theme.colorScheme.outline),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  role.role.name,
                  style: theme.textTheme.bodyMedium,
                ),
              ),
              if (field.hasError)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    field.errorText ?? '',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: theme.colorScheme.error),
                  ),
                ),
            ],
          );
        },
      );
    }

    return DropdownButtonFormField<UserRoleAssignment>(
      initialValue: selectedRole,
      isExpanded: true,
      items: activeRoles
          .map((r) => DropdownMenuItem<UserRoleAssignment>(
                value: r,
                child: Text(r.role.name),
              ))
          .toList(),
      onChanged: submitting ? null : onRoleChanged,
      validator: (v) => Validators.requiredField(
        v,
        fieldName: 'El rol',
      ),
      decoration: const InputDecoration(
        border: OutlineInputBorder(),
        hintText: 'Selecciona un rol',
        isDense: true,
      ),
    );
  }
}

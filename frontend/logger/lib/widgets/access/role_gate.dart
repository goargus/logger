import 'package:flutter/material.dart';
import '../../../models/user_role.dart';

class RoleGate extends StatelessWidget {
  final UserRole allowed;
  final UserRole current;
  final Widget child;

  const RoleGate({
    super.key,
    required this.allowed,
    required this.current,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    if (current != allowed) {
      return const Center(child: Text('No tienes acceso a esta sección.'));
    }
    return child;
  }
}

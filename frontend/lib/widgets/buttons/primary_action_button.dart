import 'package:flutter/material.dart';

class PrimaryActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  const PrimaryActionButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  static const bgcolor = Color(0xFF391A7C);

  @override
  Widget build(BuildContext context) {
    return FilledButton.icon(
      onPressed: onPressed,
      icon: Icon(icon),
      label: Text(label),
      style: FilledButton.styleFrom(
        backgroundColor: bgcolor,
      ),
    );
  }
}

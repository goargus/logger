import 'package:flutter/material.dart';

class WelcomeHeader extends StatelessWidget {
  final String userName;

  const WelcomeHeader({
    super.key,
    required this.userName,
  });

  @override
  Widget build(BuildContext context) {
    return Text(
      'Bienvenido, Hno $userName',
      style: Theme.of(context).textTheme.headlineLarge?.copyWith(
            color: const Color(0xFFFFB547),
            fontWeight: FontWeight.bold,
            letterSpacing: 0.0,
          ),
    );
  }
}

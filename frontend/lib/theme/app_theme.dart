import 'package:flutter/material.dart';

class AppTheme {
  // Paleta (morado profundo y azul)
  static const Color primary = Color(0xFF3C1E8A); // morado
  static const Color primaryDark = Color(0xFF2A1664);
  static const Color sidebarStart = Color(0xFF1D2A7A); // azul
  static const Color sidebarEnd = Color(0xFF3C1E8A); // morado
  static const Color bg = Color(0xFFF4F4FA);
  static const double radius = 16;

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(seedColor: primary);
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme.copyWith(primary: primary),
      scaffoldBackgroundColor: bg,
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      textTheme: const TextTheme(
        titleLarge: TextStyle(fontWeight: FontWeight.w800, fontSize: 26),
        titleMedium: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        bodyMedium: TextStyle(color: Colors.black87, fontSize: 14),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFFF1EEFF),
        labelStyle: const TextStyle(fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      ),
      iconTheme: const IconThemeData(size: 20),
      dividerTheme: const DividerThemeData(thickness: 1),
    );
  }
}


import 'package:flutter/material.dart';
import 'nav_item_tile.dart';
import 'user_tile.dart';

class SideNav extends StatelessWidget {
  const SideNav({
    super.key,
    required this.selectedIndex,
    required this.onSelect,
    this.logoAsset = 'assets/logo.png',
    this.showUserTile = false,
  });

  final int selectedIndex;

  final ValueChanged<int> onSelect;

  final String logoAsset;

  final bool showUserTile;

  static const Color kYellow = Color(0xFFF5C23A);
  static const Color kPill = Color(0xFFEDEFFF);
  static const Color kTextDark = Color(0xFF1E2364);
  static const LinearGradient kBackgroundGradient = LinearGradient(
  begin: Alignment.topCenter,
  end: Alignment.bottomCenter,
  colors: [
    Color(0xFF0F3999),
    Color(0xFF391A7C),
  ],
);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 300,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
     decoration: const BoxDecoration(
     gradient: SideNav.kBackgroundGradient,
  ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          Center(
            child: Image.asset(
              logoAsset,
              height: 72,
              fit: BoxFit.contain,
            ),
          ),
          const SizedBox(height: 16),
          const Divider(thickness: 1, color: Colors.white24, height: 24),
          const SizedBox(height: 8),
          const SizedBox(height: 12),
          NavItemTile(
            label: 'Inicio',
            icon: Icons.add_rounded,
            selected: selectedIndex == 1,
            onTap: () => onSelect(1),
            normalBg: kPill,
            hoverBg: kYellow,
            selectedBg: kYellow,
            normalFg: kTextDark,
            hoverFg: Colors.black,
            selectedFg: Colors.black,
          ),
          const SizedBox(height: 12),
          NavItemTile(
            label: 'Agregar Actividad',
            icon: Icons.add_rounded,
            selected: selectedIndex == 1,
            onTap: () => onSelect(1),
            normalBg: kPill,
            hoverBg: kYellow,
            selectedBg: kYellow,
            normalFg: kTextDark,
            hoverFg: Colors.black,
            selectedFg: Colors.black,
          ),
          const SizedBox(height: 12),
          NavItemTile(
            label: 'Mis Reportes',
            icon: Icons.work_outline_rounded,
            selected: selectedIndex == 2,
            onTap: () => onSelect(2),
            normalBg: kPill,
            hoverBg: kYellow,
            selectedBg: kYellow,
            normalFg: kTextDark,
            hoverFg: Colors.black,
            selectedFg: Colors.black,
          ),
          const Spacer(),
          if (showUserTile) ...[
            const SizedBox(height: 8),
            const Divider(thickness: 1, color: Colors.white24, height: 24),
            const SizedBox(height: 8),
            const UserTile(
              name: 'Andrew D.',
              email: 'andrew@email.com',
              avatarUrl: null,
            ),
          ],
        ],
      ),
    );
  }
}

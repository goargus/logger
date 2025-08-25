import 'package:flutter/material.dart';
import '../../routes.dart';
import 'nav_item_tile.dart';
import 'user_tile.dart';
import '../../theme/ app_theme.dart';

class SideNav extends StatelessWidget {
  final String activeRoute;
  const SideNav({super.key, required this.activeRoute});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 260,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppTheme.sidebarStart, AppTheme.sidebarEnd],
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 24),
            const FlutterLogo(size: 64),
            const SizedBox(height: 24),
            _Section(
              child: Column(
                children: [
                  NavItemTile(
                    icon: Icons.home_filled,
                    label: 'Inicio',
                    active: activeRoute == Routes.dashboardMissionary,
                    onTap: () => Navigator.pushReplacementNamed(
                        context, Routes.dashboardMissionary),
                  ),
                  const SizedBox(height: 10),
                  NavItemTile(
                    icon: Icons.description_outlined,
                    label: 'Mis Reportes',
                    active: activeRoute == Routes.reports,
                    onTap: () =>
                        Navigator.pushReplacementNamed(context, Routes.reports),
                  ),
                ],
              ),
            ),
            const Spacer(),
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: UserTile(
                name: 'Andrew D.',
                email: 'andrew@email.com',
                darkVariant: true, // texto claro
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final Widget child;
  const _Section({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(.08),
        borderRadius: BorderRadius.circular(14),
      ),
      child: child,
    );
  }
}

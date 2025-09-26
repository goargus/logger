import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../nav/ side_nav.dart';
import '../../providers/auth.dart';

const double kOverlayTopInset = 64.0;

class AppShell extends ConsumerWidget {
  final Widget body;
  final String activeRoute;

  static const String homeRoute = '/';
  static const String addActivityRoute = '/activities/new';
  static const String reportsRoute = '/reports';

  const AppShell({
    super.key,
    required this.body,
    required this.activeRoute,
  });

  int _mapRouteToIndex(String route) {
    switch (route) {
      case homeRoute:
        return 0;
      case addActivityRoute:
        return 1;
      case reportsRoute:
        return 2;
      default:
        return 0;
    }
  }

  void _onNavSelect(BuildContext context, int index) {
    switch (index) {
      case 0:
        if (ModalRoute.of(context)?.settings.name != homeRoute) {
          Navigator.pushNamed(context, homeRoute);
        }
        break;
      case 1:
        if (ModalRoute.of(context)?.settings.name != addActivityRoute) {
          Navigator.pushNamed(context, addActivityRoute);
        }
        break;
      case 2:
        if (ModalRoute.of(context)?.settings.name != reportsRoute) {
          Navigator.pushNamed(context, reportsRoute);
        }
        break;
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isWide = MediaQuery.of(context).size.width >= 1000;

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.only(top: kOverlayTopInset),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isWide) const SizedBox(width: 8),
                  if (isWide)
                    SideNav(
                      selectedIndex: _mapRouteToIndex(activeRoute),
                      onSelect: (i) => _onNavSelect(context, i),
                    ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: body,
                    ),
                  ),
                ],
              ),
            ),

            Positioned(
              top: 8,
              right: 12,
              child: Consumer(
                builder: (context, ref, _) {
                  final authState = ref.watch(authProvider);
                  final authNotifier = ref.read(authProvider.notifier);
                  final userEmail = authState.credentials?.user.email;
                  return ActionChip(
                    label: Text(
                      userEmail != null && userEmail.isNotEmpty
                          ? 'Salir ($userEmail)'
                          : 'Salir',
                    ),
                    onPressed: authNotifier.logout,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

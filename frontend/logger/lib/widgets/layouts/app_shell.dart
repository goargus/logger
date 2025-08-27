
import 'package:flutter/material.dart';
import '../nav/ side_nav.dart';

/// App shell that places the SideNav on wide screens and the page body at right.
/// It maps a route string (activeRoute) to the SideNav selected index and
/// navigates when the user clicks an item.
class AppShell extends StatelessWidget {
  final String activeRoute;
  final Widget body;

  const AppShell({super.key, required this.activeRoute, required this.body});

  @override
  Widget build(BuildContext context) {
    // Define your routes here so it's easy to change in one place.
    const homeRoute = '/inicio';
    const addActivityRoute = '/actividad';
    const reportsRoute = '/reportes';

    int mapRouteToIndex(String route) {
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

    void onNavSelect(int i) {
      switch (i) {
        case 0:
          Navigator.pushNamed(context, homeRoute);
          break;
        case 1:
          Navigator.pushNamed(context, addActivityRoute);
          break;
        case 2:
          Navigator.pushNamed(context, reportsRoute);
          break;
      }
    }

    return LayoutBuilder(builder: (context, c) {
      final isWide = c.maxWidth >= 1000;
      return Scaffold(
        body: SafeArea(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isWide) const SizedBox(width: 12),
              if (isWide)
                SideNav(
                  selectedIndex: mapRouteToIndex(activeRoute),
                  onSelect: onNavSelect,
                ),
              Expanded(child: body),
            ],
          ),
        ),
      );
    });
  }
}

import 'package:flutter/material.dart';
import '../nav/ side_nav.dart';

class AppShell extends StatelessWidget {
  final String activeRoute;
  final Widget body;

  const AppShell({super.key, required this.activeRoute, required this.body});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, c) {
      final isWide = c.maxWidth >= 1000;
      return Scaffold(
        body: SafeArea(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isWide) const SizedBox(width: 12),
              if (isWide) SideNav(activeRoute: activeRoute),
              Expanded(child: body),
            ],
          ),
        ),
      );
    });
  }
}

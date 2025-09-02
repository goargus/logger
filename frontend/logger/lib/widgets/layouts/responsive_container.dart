import 'package:flutter/material.dart';

class ResponsiveContainer extends StatelessWidget {
  final Widget child;
  const ResponsiveContainer({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, c) {
      final maxW = c.maxWidth;
      final double pad = maxW < 800 ? 12 : 24;
      return Padding(
        padding: EdgeInsets.all(pad),
        child: child,
      );
    });
  }
}

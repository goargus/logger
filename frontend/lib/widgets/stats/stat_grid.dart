import 'package:flutter/material.dart';

class StatGrid extends StatelessWidget {
  final List<Widget> children;
  const StatGrid({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, c) {
      final w = c.maxWidth;
      final cross = w < 700
          ? 1
          : w < 1000
              ? 2
              : 3;
      return GridView.count(
        crossAxisCount: cross,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 2.8,
        children: children,
      );
    });
  }
}

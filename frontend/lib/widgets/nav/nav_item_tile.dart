import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// A single pill-like navigation item with hover -> yellow behavior.
class NavItemTile extends StatefulWidget {
  const NavItemTile({
    super.key,
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
    this.normalBg = const Color(0xFFEDEFFF),
    this.hoverBg = const Color(0xFFF5C23A),
    this.selectedBg = const Color(0xFFF5C23A),
    this.normalFg = const Color(0xFF1E2364),
    this.hoverFg = Colors.black,
    this.selectedFg = Colors.black,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  final Color normalBg;
  final Color hoverBg;
  final Color selectedBg;

  final Color normalFg;
  final Color hoverFg;
  final Color selectedFg;

  @override
  State<NavItemTile> createState() => _NavItemTileState();
}

class _NavItemTileState extends State<NavItemTile> {
  bool _hovering = false;

  void _setHover(bool v) {
    if (!kIsWeb) return; // hover is only meaningful on web/desktop
    if (_hovering == v) return;
    setState(() => _hovering = v);
  }

  @override
  Widget build(BuildContext context) {
    final bool isHover = _hovering && !widget.selected;
    final Color bg = widget.selected
        ? widget.selectedBg
        : (isHover ? widget.hoverBg : widget.normalBg);
    final Color fg = widget.selected
        ? widget.selectedFg
        : (isHover ? widget.hoverFg : widget.normalFg);

    return MouseRegion(
      onEnter: (_) => _setHover(true),
      onExit: (_) => _setHover(false),
      cursor: SystemMouseCursors.click,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: widget.onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            curve: Curves.easeOut,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                if (widget.selected || _hovering)
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
              ],
            ),
            child: Row(
              children: [
                // Small rounded square with the icon
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: Colors.white
                        .withValues(alpha: widget.selected ? 0.95 : 0.9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    widget.icon,
                    size: 18,
                    color: widget.selected ? Colors.black : fg,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    widget.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: fg,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

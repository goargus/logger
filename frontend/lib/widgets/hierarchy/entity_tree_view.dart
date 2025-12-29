import 'package:flutter/material.dart';
import '../../models/entity_hierarchy.dart';

/// A widget that displays an entity hierarchy as an expandable tree view
class EntityTreeView extends StatefulWidget {
  const EntityTreeView({
    super.key,
    required this.tree,
    this.selectedEntityId,
    this.onEntitySelected,
    this.expandedByDefault = true,
  });

  final EntityTreeNode tree;
  final String? selectedEntityId;
  final ValueChanged<EntityTreeNode>? onEntitySelected;
  final bool expandedByDefault;

  @override
  State<EntityTreeView> createState() => _EntityTreeViewState();
}

class _EntityTreeViewState extends State<EntityTreeView> {
  late Set<String> _expandedNodes;

  @override
  void initState() {
    super.initState();
    _expandedNodes = widget.expandedByDefault
        ? _collectAllNodeIds(widget.tree)
        : {widget.tree.id};
  }

  Set<String> _collectAllNodeIds(EntityTreeNode node) {
    final ids = <String>{node.id};
    for (final child in node.children) {
      ids.addAll(_collectAllNodeIds(child));
    }
    return ids;
  }

  void _toggleNode(String nodeId) {
    setState(() {
      if (_expandedNodes.contains(nodeId)) {
        _expandedNodes.remove(nodeId);
      } else {
        _expandedNodes.add(nodeId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: _buildTreeNode(widget.tree, 0),
    );
  }

  Widget _buildTreeNode(EntityTreeNode node, int depth) {
    final isExpanded = _expandedNodes.contains(node.id);
    final isSelected = node.id == widget.selectedEntityId;
    final hasChildren = node.hasChildren;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _EntityTreeItem(
          node: node,
          depth: depth,
          isExpanded: isExpanded,
          isSelected: isSelected,
          hasChildren: hasChildren,
          onTap: () => widget.onEntitySelected?.call(node),
          onExpandToggle: hasChildren ? () => _toggleNode(node.id) : null,
        ),
        if (isExpanded && hasChildren)
          ...node.children.map((child) => _buildTreeNode(child, depth + 1)),
      ],
    );
  }
}

class _EntityTreeItem extends StatelessWidget {
  const _EntityTreeItem({
    required this.node,
    required this.depth,
    required this.isExpanded,
    required this.isSelected,
    required this.hasChildren,
    this.onTap,
    this.onExpandToggle,
  });

  final EntityTreeNode node;
  final int depth;
  final bool isExpanded;
  final bool isSelected;
  final bool hasChildren;
  final VoidCallback? onTap;
  final VoidCallback? onExpandToggle;

  IconData _getEntityIcon() {
    switch (node.type) {
      case EntityType.platform:
        return Icons.public;
      case EntityType.union:
        return Icons.account_balance;
      case EntityType.association:
        return Icons.groups;
      case EntityType.field:
        return Icons.location_on;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final indent = depth * 24.0;

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.only(left: indent + 8, right: 8, top: 8, bottom: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? theme.colorScheme.primaryContainer.withValues(alpha: 0.3)
              : null,
          border: isSelected
              ? Border(
                  left: BorderSide(
                    color: theme.colorScheme.primary,
                    width: 3,
                  ),
                )
              : null,
        ),
        child: Row(
          children: [
            if (hasChildren)
              GestureDetector(
                onTap: onExpandToggle,
                child: Icon(
                  isExpanded ? Icons.expand_more : Icons.chevron_right,
                  size: 20,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              )
            else
              const SizedBox(width: 20),
            const SizedBox(width: 4),
            Icon(
              _getEntityIcon(),
              size: 18,
              color: isSelected
                  ? theme.colorScheme.primary
                  : theme.colorScheme.onSurfaceVariant,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    node.name,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.normal,
                      color: isSelected
                          ? theme.colorScheme.primary
                          : theme.colorScheme.onSurface,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    node.type.displayName,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            if (hasChildren)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${node.children.length}',
                  style: theme.textTheme.labelSmall,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

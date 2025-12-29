import 'package:flutter/material.dart';
import '../../models/entity_hierarchy.dart';

/// A breadcrumb widget showing the path from root to current entity
class EntityBreadcrumb extends StatelessWidget {
  const EntityBreadcrumb({
    super.key,
    required this.path,
    this.onEntityTap,
  });

  /// List of entities from root to current (in order)
  final List<EntityInfo> path;

  /// Callback when an entity in the breadcrumb is tapped
  final ValueChanged<EntityInfo>? onEntityTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (path.isEmpty) {
      return const SizedBox.shrink();
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (int i = 0; i < path.length; i++) ...[
            if (i > 0) ...[
              Icon(
                Icons.chevron_right,
                size: 18,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ],
            _BreadcrumbItem(
              entity: path[i],
              isLast: i == path.length - 1,
              onTap: onEntityTap != null ? () => onEntityTap!(path[i]) : null,
            ),
          ],
        ],
      ),
    );
  }
}

class _BreadcrumbItem extends StatelessWidget {
  const _BreadcrumbItem({
    required this.entity,
    required this.isLast,
    this.onTap,
  });

  final EntityInfo entity;
  final bool isLast;
  final VoidCallback? onTap;

  IconData _getEntityIcon() {
    switch (entity.type) {
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

    return InkWell(
      onTap: isLast ? null : onTap,
      borderRadius: BorderRadius.circular(4),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _getEntityIcon(),
              size: 16,
              color: isLast
                  ? theme.colorScheme.primary
                  : theme.colorScheme.onSurfaceVariant,
            ),
            const SizedBox(width: 4),
            Text(
              entity.name,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isLast
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurfaceVariant,
                fontWeight: isLast ? FontWeight.bold : FontWeight.normal,
                decoration: isLast ? null : TextDecoration.underline,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A simpler breadcrumb that takes a tree node and builds the path automatically
class EntityTreeBreadcrumb extends StatelessWidget {
  const EntityTreeBreadcrumb({
    super.key,
    required this.rootTree,
    required this.selectedEntityId,
    this.onEntityTap,
  });

  final EntityTreeNode rootTree;
  final String selectedEntityId;
  final ValueChanged<String>? onEntityTap;

  List<EntityInfo> _buildPathToEntity(EntityTreeNode node, String targetId, List<EntityInfo> currentPath) {
    final nodeInfo = EntityInfo(
      id: node.id,
      name: node.name,
      type: node.type,
      code: node.code,
      isActive: node.isActive,
    );

    final newPath = [...currentPath, nodeInfo];

    if (node.id == targetId) {
      return newPath;
    }

    for (final child in node.children) {
      final result = _buildPathToEntity(child, targetId, newPath);
      if (result.isNotEmpty) {
        return result;
      }
    }

    return [];
  }

  @override
  Widget build(BuildContext context) {
    final path = _buildPathToEntity(rootTree, selectedEntityId, []);

    return EntityBreadcrumb(
      path: path,
      onEntityTap: onEntityTap != null
          ? (entity) => onEntityTap!(entity.id)
          : null,
    );
  }
}

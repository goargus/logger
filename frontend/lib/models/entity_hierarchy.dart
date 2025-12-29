/// Entity type enum matching backend EntityType
enum EntityType {
  platform,
  union,
  association,
  field;

  String get displayName {
    switch (this) {
      case EntityType.platform:
        return 'Plataforma';
      case EntityType.union:
        return 'Unión';
      case EntityType.association:
        return 'Asociación';
      case EntityType.field:
        return 'Campo';
    }
  }

  static EntityType fromString(String value) {
    switch (value.toUpperCase()) {
      case 'PLATFORM':
        return EntityType.platform;
      case 'UNION':
        return EntityType.union;
      case 'ASSOCIATION':
        return EntityType.association;
      case 'FIELD':
        return EntityType.field;
      default:
        return EntityType.field;
    }
  }
}

/// Tree node representation of an entity in the hierarchy
class EntityTreeNode {
  final String id;
  final String name;
  final EntityType type;
  final String? code;
  final bool isActive;
  final List<EntityTreeNode> children;

  const EntityTreeNode({
    required this.id,
    required this.name,
    required this.type,
    this.code,
    required this.isActive,
    required this.children,
  });

  factory EntityTreeNode.fromApi(Map<String, dynamic> data) {
    final childrenData = data['children'] as List<dynamic>? ?? [];
    return EntityTreeNode(
      id: data['id'] as String,
      name: data['name'] as String,
      type: EntityType.fromString(data['type'] as String? ?? 'FIELD'),
      code: data['code'] as String?,
      isActive: data['is_active'] as bool? ?? true,
      children: childrenData
          .map((child) => EntityTreeNode.fromApi(child as Map<String, dynamic>))
          .toList(),
    );
  }

  /// Returns true if this node has any children
  bool get hasChildren => children.isNotEmpty;

  /// Returns total count of all descendants (including nested children)
  int get descendantCount {
    int count = children.length;
    for (final child in children) {
      count += child.descendantCount;
    }
    return count;
  }
}

/// Flat entity representation (for descendants list)
class EntityInfo {
  final String id;
  final String name;
  final EntityType type;
  final String? code;
  final String? parentId;
  final bool isActive;

  const EntityInfo({
    required this.id,
    required this.name,
    required this.type,
    this.code,
    this.parentId,
    required this.isActive,
  });

  factory EntityInfo.fromApi(Map<String, dynamic> data) {
    return EntityInfo(
      id: data['id'] as String,
      name: data['name'] as String,
      type: EntityType.fromString(data['type'] as String? ?? 'FIELD'),
      code: data['code'] as String?,
      parentId: data['parent_id'] as String?,
      isActive: data['is_active'] as bool? ?? true,
    );
  }
}

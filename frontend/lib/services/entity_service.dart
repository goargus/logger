import '../config/api_config.dart';
import '../core/api_client.dart';
import '../models/entity_hierarchy.dart';

/// Service for entity-related API calls, especially hierarchy operations
class EntityService {
  EntityService({
    required this.apiClient,
  });

  final ApiClient apiClient;

  factory EntityService.localhost(AccessTokenProvider getAccessToken) {
    final apiClient = ApiClient(
      baseUrl: ApiConfig.baseUrl,
      getAccessToken: getAccessToken,
    );
    return EntityService(apiClient: apiClient);
  }

  /// Get hierarchy tree for an entity (nested structure with children)
  Future<EntityTreeNode?> getHierarchyTree(String entityId) async {
    try {
      final data = await apiClient.get('entities/$entityId/tree');
      return EntityTreeNode.fromApi(data as Map<String, dynamic>);
    } catch (e) {
      return null;
    }
  }

  /// Get all descendants of an entity (flat list)
  Future<List<EntityInfo>> getDescendants(String entityId) async {
    try {
      final data = await apiClient.get('entities/$entityId/descendants');
      final items = data as List<dynamic>? ?? [];
      return items
          .map((item) => EntityInfo.fromApi(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Get direct children of an entity
  Future<List<EntityInfo>> getChildren(String entityId) async {
    try {
      final data = await apiClient.get('entities/$entityId/children');
      final items = data as List<dynamic>? ?? [];
      return items
          .map((item) => EntityInfo.fromApi(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  /// Get all entities (for admin views)
  Future<List<EntityInfo>> getAllEntities() async {
    try {
      final data = await apiClient.get('entities');
      final items = data as List<dynamic>? ?? [];
      return items
          .map((item) => EntityInfo.fromApi(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }
}

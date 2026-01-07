import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../core/api_client.dart';

typedef GetTokenFn = Future<String?> Function();

class UserProfile {
  final String id;
  final String username;
  final String email;
  final String? fullName;
  final String? firstName;
  final String? familyName;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String currencySymbol;
  final UserRole primaryRole;
  final UserEntity primaryEntity;
  final List<RoleAssignment> roleAssignments;

  UserProfile({
    required this.id,
    required this.username,
    required this.email,
    this.fullName,
    this.firstName,
    this.familyName,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    required this.currencySymbol,
    required this.primaryRole,
    required this.primaryEntity,
    required this.roleAssignments,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String,
      fullName: json['full_name'] as String?,
      firstName: json['first_name'] as String?,
      familyName: json['family_name'] as String?,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      currencySymbol: json['currency_symbol'] as String? ?? '\$',
      primaryRole:
          UserRole.fromJson(json['primary_role'] as Map<String, dynamic>),
      primaryEntity:
          UserEntity.fromJson(json['primary_entity'] as Map<String, dynamic>),
      roleAssignments: (json['role_assignments'] as List)
          .map((e) => RoleAssignment.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class UserRole {
  final String id;
  final String name;
  final String description;

  UserRole({
    required this.id,
    required this.name,
    required this.description,
  });

  factory UserRole.fromJson(Map<String, dynamic> json) {
    return UserRole(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
    );
  }
}

class UserEntity {
  final String id;
  final String name;
  final String description;
  final String type;
  final String? parentId;
  final String? currencySymbol;

  UserEntity({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    this.parentId,
    this.currencySymbol,
  });

  factory UserEntity.fromJson(Map<String, dynamic> json) {
    return UserEntity(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      type: json['type'] as String,
      parentId: json['parent_id'] as String?,
      currencySymbol: json['currency_symbol'] as String?,
    );
  }
}

class RoleAssignment {
  final String id;
  final UserRole role;
  final UserEntity entity;
  final DateTime createdAt;
  final DateTime updatedAt;

  RoleAssignment({
    required this.id,
    required this.role,
    required this.entity,
    required this.createdAt,
    required this.updatedAt,
  });

  factory RoleAssignment.fromJson(Map<String, dynamic> json) {
    return RoleAssignment(
      id: json['id'] as String,
      role: UserRole.fromJson(json['role'] as Map<String, dynamic>),
      entity: UserEntity.fromJson(json['entity'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}

class UserService {
  final ApiClient apiClient;

  UserService({
    required this.apiClient,
  });

  factory UserService.localhost(GetTokenFn getAccessToken) {
    final apiClient = ApiClient(
      baseUrl: ApiConfig.baseUrl,
      getAccessToken: () async {
        final token = await getAccessToken();
        return token ?? '';
      },
    );
    return UserService(apiClient: apiClient);
  }

  Future<UserProfile> getMyProfile() async {
    try {
      final decoded = await apiClient.get('users/me');
      debugPrint('[UserService] Successfully fetched user profile');
      return UserProfile.fromJson(decoded as Map<String, dynamic>);
    } catch (e) {
      debugPrint('[UserService] Error fetching user profile: $e');
      rethrow;
    }
  }
}

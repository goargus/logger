import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class HttpException implements Exception {
  final String message;
  final int? statusCode;
  final String? body;
  const HttpException(this.message, {this.statusCode, this.body});
  @override
  String toString() => 'HttpException($message, status: $statusCode)';
}

class UnauthorizedException implements Exception {
  final String message;
  const UnauthorizedException(this.message);
  @override
  String toString() => 'UnauthorizedException($message)';
}

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

  UserEntity({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    this.parentId,
  });

  factory UserEntity.fromJson(Map<String, dynamic> json) {
    return UserEntity(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      type: json['type'] as String,
      parentId: json['parent_id'] as String?,
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
  final String baseUrl;
  final GetTokenFn getAccessToken;
  final http.Client _client;

  UserService({
    required this.baseUrl,
    required this.getAccessToken,
    http.Client? client,
  }) : _client = client ?? http.Client();

  factory UserService.localhost(GetTokenFn getAccessToken) {
    return UserService(
      baseUrl: 'http://localhost:3000',
      getAccessToken: getAccessToken,
    );
  }

  Future<UserProfile> getMyProfile() async {
    Future<UserProfile> doFetch(String token) async {
      final uri = Uri.parse('$baseUrl/users/me');

      final resp = await _client.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      debugPrint('[UserService] GET $uri -> ${resp.statusCode}');

      if (resp.statusCode == 200) {
        final decoded = jsonDecode(resp.body) as Map<String, dynamic>;
        return UserProfile.fromJson(decoded);
      }

      if (resp.statusCode == 401) {
        throw const UnauthorizedException(
            'Unauthorized (401): invalid or expired token');
      }

      throw HttpException(
        'Failed to load user profile',
        statusCode: resp.statusCode,
        body: resp.body,
      );
    }

    var token = await getAccessToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException('Missing access token');
    }

    try {
      return await doFetch(token);
    } on UnauthorizedException {
      final refreshed = await getAccessToken();
      if (refreshed != null && refreshed.isNotEmpty && refreshed != token) {
        debugPrint('[UserService] Retrying after 401 with refreshed token');
        return await doFetch(refreshed);
      }
      rethrow;
    }
  }

  void close() {
    _client.close();
  }
}

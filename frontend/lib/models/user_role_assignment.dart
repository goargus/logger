class UserRoleAssignmentRole {
  final String id;
  final String name;
  final String description;

  UserRoleAssignmentRole({
    required this.id,
    required this.name,
    required this.description,
  });

  factory UserRoleAssignmentRole.fromJson(Map<String, dynamic> json) {
    return UserRoleAssignmentRole(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
    );
  }
}

class UserRoleAssignmentEntity {
  final String id;
  final String name;
  final String description;
  final String type;

  UserRoleAssignmentEntity({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
  });

  factory UserRoleAssignmentEntity.fromJson(Map<String, dynamic> json) {
    return UserRoleAssignmentEntity(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      type: json['type'] as String,
    );
  }
}

class UserRoleAssignment {
  final String id;
  final UserRoleAssignmentRole role;
  final UserRoleAssignmentEntity entity;
  final String startDate;
  final String endDate;

  UserRoleAssignment({
    required this.id,
    required this.role,
    required this.entity,
    required this.startDate,
    required this.endDate,
  });

  factory UserRoleAssignment.fromJson(Map<String, dynamic> json) {
    return UserRoleAssignment(
      id: json['id'] as String,
      role: UserRoleAssignmentRole.fromJson(json['role'] as Map<String, dynamic>),
      entity: UserRoleAssignmentEntity.fromJson(json['entity'] as Map<String, dynamic>),
      startDate: json['start_date'] as String,
      endDate: json['end_date'] as String,
    );
  }

  bool get isActive {
    final now = DateTime.now();
    final start = DateTime.parse(startDate);
    final end = DateTime.parse(endDate);
    return now.isAfter(start) && now.isBefore(end);
  }
}

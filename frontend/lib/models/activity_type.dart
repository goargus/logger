class Role {
  final String id;
  final String name;
  final String description;

  Role({
    required this.id,
    required this.name,
    required this.description,
  });

  factory Role.fromJson(Map<String, dynamic> json) {
    return Role(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
    );
  }
}

class ActivityType {
  final String id;
  final String name;
  final String description;
  final List<Role> allowedRoles;

  ActivityType({
    required this.id,
    required this.name,
    required this.description,
    this.allowedRoles = const [],
  });

  factory ActivityType.fromJson(Map<String, dynamic> json) {
    final rolesJson = json['allowed_roles'] as List<dynamic>?;
    final roles = rolesJson
            ?.map((r) => Role.fromJson(r as Map<String, dynamic>))
            .toList() ??
        [];

    return ActivityType(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      allowedRoles: roles,
    );
  }
}


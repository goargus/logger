class EngagementUser {
  final String userId;
  final String name;
  final List<String> roles;
  final String entity;
  final int activityCount;
  final String? lastActivityDate;
  final double? trend;

  EngagementUser({
    required this.userId,
    required this.name,
    required this.roles,
    required this.entity,
    required this.activityCount,
    this.lastActivityDate,
    this.trend,
  });

  factory EngagementUser.fromApi(Map<String, dynamic> json) {
    return EngagementUser(
      userId: json['userId'] as String,
      name: json['name'] as String,
      roles: (json['roles'] as List<dynamic>).map((r) => r as String).toList(),
      entity: json['entity'] as String,
      activityCount: json['activityCount'] as int,
      lastActivityDate: json['lastActivityDate'] as String?,
      trend: (json['trend'] as num?)?.toDouble(),
    );
  }
}

class EngagementSummary {
  final int totalUsers;
  final int activeUsers;
  final int inactiveUsers;
  final double avgActivitiesPerUser;

  EngagementSummary({
    required this.totalUsers,
    required this.activeUsers,
    required this.inactiveUsers,
    required this.avgActivitiesPerUser,
  });

  factory EngagementSummary.fromApi(Map<String, dynamic> json) {
    return EngagementSummary(
      totalUsers: json['totalUsers'] as int,
      activeUsers: json['activeUsers'] as int,
      inactiveUsers: json['inactiveUsers'] as int,
      avgActivitiesPerUser: (json['avgActivitiesPerUser'] as num).toDouble(),
    );
  }
}

class EngagementResponse {
  final List<EngagementUser> users;
  final EngagementSummary summary;

  EngagementResponse({
    required this.users,
    required this.summary,
  });

  factory EngagementResponse.fromApi(Map<String, dynamic> json) {
    return EngagementResponse(
      users: (json['users'] as List<dynamic>)
          .map((u) => EngagementUser.fromApi(u as Map<String, dynamic>))
          .toList(),
      summary: EngagementSummary.fromApi(json['summary'] as Map<String, dynamic>),
    );
  }

  factory EngagementResponse.empty() {
    return EngagementResponse(
      users: [],
      summary: EngagementSummary(
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        avgActivitiesPerUser: 0,
      ),
    );
  }
}

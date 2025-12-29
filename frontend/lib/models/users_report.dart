/// Role assignment for a user
class UserRoleAssignment {
  final String roleId;
  final String roleName;
  final String entityId;
  final String entityName;
  final String startDate;
  final String endDate;
  final bool isActive;

  const UserRoleAssignment({
    required this.roleId,
    required this.roleName,
    required this.entityId,
    required this.entityName,
    required this.startDate,
    required this.endDate,
    required this.isActive,
  });

  factory UserRoleAssignment.fromApi(Map<String, dynamic> json) {
    return UserRoleAssignment(
      roleId: json['roleId'] as String? ?? '',
      roleName: json['roleName'] as String? ?? 'Unknown',
      entityId: json['entityId'] as String? ?? '',
      entityName: json['entityName'] as String? ?? 'Unknown',
      startDate: json['startDate'] as String? ?? '',
      endDate: json['endDate'] as String? ?? '',
      isActive: json['isActive'] as bool? ?? false,
    );
  }
}

/// User report item with activity metrics
class UserReportItem {
  final String userId;
  final String name;
  final String email;
  final String entityId;
  final String entityName;
  final String entityType;
  final String roleId;
  final String roleName;
  final List<UserRoleAssignment> roleAssignments;
  final int activitiesCount;
  final double totalExpenses;
  final String? lastActivityDate;
  final bool hasSubmitted;

  const UserReportItem({
    required this.userId,
    required this.name,
    required this.email,
    required this.entityId,
    required this.entityName,
    required this.entityType,
    required this.roleId,
    required this.roleName,
    required this.roleAssignments,
    required this.activitiesCount,
    required this.totalExpenses,
    this.lastActivityDate,
    required this.hasSubmitted,
  });

  factory UserReportItem.fromApi(Map<String, dynamic> json) {
    final assignmentsList = (json['roleAssignments'] as List<dynamic>?)
            ?.map((e) => UserRoleAssignment.fromApi(e as Map<String, dynamic>))
            .toList() ??
        [];

    return UserReportItem(
      userId: json['userId'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      entityId: json['entityId'] as String,
      entityName: json['entityName'] as String,
      entityType: json['entityType'] as String,
      roleId: json['roleId'] as String? ?? '',
      roleName: json['roleName'] as String,
      roleAssignments: assignmentsList,
      activitiesCount: json['activitiesCount'] as int,
      totalExpenses: (json['totalExpenses'] as num).toDouble(),
      lastActivityDate: json['lastActivityDate'] as String?,
      hasSubmitted: json['hasSubmitted'] as bool,
    );
  }

  /// Get active role assignments only
  List<UserRoleAssignment> get activeRoleAssignments =>
      roleAssignments.where((r) => r.isActive).toList();

  /// Get display string for all active roles
  String get activeRolesDisplay {
    final active = activeRoleAssignments;
    if (active.isEmpty) return roleName;
    return active.map((r) => r.roleName).toSet().join(', ');
  }
}

/// Pagination info
class UsersReportPagination {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  const UsersReportPagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory UsersReportPagination.fromApi(Map<String, dynamic> json) {
    return UsersReportPagination(
      page: json['page'] as int,
      limit: json['limit'] as int,
      total: json['total'] as int,
      totalPages: json['totalPages'] as int,
    );
  }

  bool get hasNextPage => page < totalPages;
  bool get hasPreviousPage => page > 1;
}

/// Summary totals
class UsersReportSummary {
  final int totalUsers;
  final int usersSubmitted;
  final int usersNotSubmitted;
  final int totalActivities;
  final double totalExpenses;

  const UsersReportSummary({
    required this.totalUsers,
    required this.usersSubmitted,
    required this.usersNotSubmitted,
    required this.totalActivities,
    required this.totalExpenses,
  });

  factory UsersReportSummary.fromApi(Map<String, dynamic> json) {
    return UsersReportSummary(
      totalUsers: json['totalUsers'] as int,
      usersSubmitted: json['usersSubmitted'] as int,
      usersNotSubmitted: json['usersNotSubmitted'] as int,
      totalActivities: json['totalActivities'] as int,
      totalExpenses: (json['totalExpenses'] as num).toDouble(),
    );
  }

  double get complianceRate =>
      totalUsers > 0 ? usersSubmitted / totalUsers : 0;
}

/// Full users report response
class UsersReportResponse {
  final List<UserReportItem> users;
  final UsersReportPagination pagination;
  final UsersReportSummary summary;

  const UsersReportResponse({
    required this.users,
    required this.pagination,
    required this.summary,
  });

  factory UsersReportResponse.fromApi(Map<String, dynamic> json) {
    final usersList = (json['users'] as List<dynamic>)
        .map((e) => UserReportItem.fromApi(e as Map<String, dynamic>))
        .toList();

    return UsersReportResponse(
      users: usersList,
      pagination:
          UsersReportPagination.fromApi(json['pagination'] as Map<String, dynamic>),
      summary:
          UsersReportSummary.fromApi(json['summary'] as Map<String, dynamic>),
    );
  }

  factory UsersReportResponse.empty() {
    return const UsersReportResponse(
      users: [],
      pagination: UsersReportPagination(
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      ),
      summary: UsersReportSummary(
        totalUsers: 0,
        usersSubmitted: 0,
        usersNotSubmitted: 0,
        totalActivities: 0,
        totalExpenses: 0,
      ),
    );
  }

  bool get isEmpty => users.isEmpty;
}

/// Compliance filter options
enum ComplianceFilter {
  all,
  submitted,
  notSubmitted;

  String get apiValue {
    switch (this) {
      case ComplianceFilter.all:
        return 'all';
      case ComplianceFilter.submitted:
        return 'submitted';
      case ComplianceFilter.notSubmitted:
        return 'notSubmitted';
    }
  }

  String get label {
    switch (this) {
      case ComplianceFilter.all:
        return 'Todos';
      case ComplianceFilter.submitted:
        return 'Han reportado';
      case ComplianceFilter.notSubmitted:
        return 'Sin reportar';
    }
  }
}

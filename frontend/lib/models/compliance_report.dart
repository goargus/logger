/// User who has submitted activities
class SubmittedUser {
  final String userId;
  final String name;
  final int count;
  final String lastActivity;

  const SubmittedUser({
    required this.userId,
    required this.name,
    required this.count,
    required this.lastActivity,
  });

  factory SubmittedUser.fromApi(Map<String, dynamic> json) {
    return SubmittedUser(
      userId: json['userId'] as String,
      name: json['name'] as String,
      count: json['count'] as int,
      lastActivity: json['lastActivity'] as String,
    );
  }
}

/// User who has not submitted activities
class NotSubmittedUser {
  final String userId;
  final String name;
  final List<String> roles;
  final String entity;

  const NotSubmittedUser({
    required this.userId,
    required this.name,
    required this.roles,
    required this.entity,
  });

  factory NotSubmittedUser.fromApi(Map<String, dynamic> json) {
    final rolesList =
        (json['roles'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
            [];

    return NotSubmittedUser(
      userId: json['userId'] as String,
      name: json['name'] as String,
      roles: rolesList,
      entity: json['entity'] as String,
    );
  }
}

/// Compliance report response
class ComplianceResponse {
  final List<SubmittedUser> submitted;
  final List<NotSubmittedUser> notSubmitted;

  const ComplianceResponse({
    required this.submitted,
    required this.notSubmitted,
  });

  factory ComplianceResponse.fromApi(Map<String, dynamic> json) {
    final submittedList = (json['submitted'] as List<dynamic>?)
            ?.map((e) => SubmittedUser.fromApi(e as Map<String, dynamic>))
            .toList() ??
        [];

    final notSubmittedList = (json['notSubmitted'] as List<dynamic>?)
            ?.map((e) => NotSubmittedUser.fromApi(e as Map<String, dynamic>))
            .toList() ??
        [];

    return ComplianceResponse(
      submitted: submittedList,
      notSubmitted: notSubmittedList,
    );
  }

  factory ComplianceResponse.empty() {
    return const ComplianceResponse(
      submitted: [],
      notSubmitted: [],
    );
  }

  int get totalUsers => submitted.length + notSubmitted.length;
  bool get isEmpty => submitted.isEmpty && notSubmitted.isEmpty;
}

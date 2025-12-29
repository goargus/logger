/// Model for user information in activities response
class UserInfo {
  final String id;
  final String name;
  final String email;
  final String entityName;
  final String entityType;
  final String roleName;

  const UserInfo({
    required this.id,
    required this.name,
    required this.email,
    required this.entityName,
    required this.entityType,
    required this.roleName,
  });

  factory UserInfo.fromApi(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      entityName: json['entityName'] as String,
      entityType: json['entityType'] as String,
      roleName: json['roleName'] as String,
    );
  }
}

/// Model for individual activity in the response
class UserActivity {
  final String id;
  final String date;
  final String typeName;
  final String typeId;
  final String? description;
  final bool hasExpense;
  final String? expenseAmount;
  final String status;
  final String createdAt;

  const UserActivity({
    required this.id,
    required this.date,
    required this.typeName,
    required this.typeId,
    this.description,
    required this.hasExpense,
    this.expenseAmount,
    required this.status,
    required this.createdAt,
  });

  factory UserActivity.fromApi(Map<String, dynamic> json) {
    return UserActivity(
      id: json['id'] as String,
      date: json['date'] as String,
      typeName: json['typeName'] as String,
      typeId: json['typeId'] as String,
      description: json['description'] as String?,
      hasExpense: json['hasExpense'] as bool,
      expenseAmount: json['expenseAmount'] as String?,
      status: json['status'] as String,
      createdAt: json['createdAt'] as String,
    );
  }

  double get expenseAmountValue {
    if (!hasExpense || expenseAmount == null) return 0;
    return double.tryParse(expenseAmount!) ?? 0;
  }
}

/// Model for totals in the response
class UserActivitiesTotals {
  final int count;
  final double expenses;

  const UserActivitiesTotals({
    required this.count,
    required this.expenses,
  });

  factory UserActivitiesTotals.fromApi(Map<String, dynamic> json) {
    return UserActivitiesTotals(
      count: json['count'] as int,
      expenses: (json['expenses'] as num).toDouble(),
    );
  }
}

/// Model for pagination info
class UserActivitiesPagination {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  const UserActivitiesPagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory UserActivitiesPagination.fromApi(Map<String, dynamic> json) {
    return UserActivitiesPagination(
      page: json['page'] as int,
      limit: json['limit'] as int,
      total: json['total'] as int,
      totalPages: json['totalPages'] as int,
    );
  }

  bool get hasNextPage => page < totalPages;
  bool get hasPreviousPage => page > 1;
}

/// Complete response for user activities endpoint
class UserActivitiesResponse {
  final UserInfo user;
  final List<UserActivity> activities;
  final UserActivitiesTotals totals;
  final UserActivitiesPagination pagination;

  const UserActivitiesResponse({
    required this.user,
    required this.activities,
    required this.totals,
    required this.pagination,
  });

  factory UserActivitiesResponse.fromApi(Map<String, dynamic> json) {
    final activitiesList = (json['activities'] as List<dynamic>)
        .map((item) => UserActivity.fromApi(item as Map<String, dynamic>))
        .toList();

    return UserActivitiesResponse(
      user: UserInfo.fromApi(json['user'] as Map<String, dynamic>),
      activities: activitiesList,
      totals:
          UserActivitiesTotals.fromApi(json['totals'] as Map<String, dynamic>),
      pagination: UserActivitiesPagination.fromApi(
          json['pagination'] as Map<String, dynamic>),
    );
  }

  factory UserActivitiesResponse.empty() {
    return const UserActivitiesResponse(
      user: UserInfo(
        id: '',
        name: '',
        email: '',
        entityName: '',
        entityType: '',
        roleName: '',
      ),
      activities: [],
      totals: UserActivitiesTotals(count: 0, expenses: 0),
      pagination:
          UserActivitiesPagination(page: 1, limit: 20, total: 0, totalPages: 0),
    );
  }

  bool get isEmpty => activities.isEmpty;
}

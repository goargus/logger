// Models for leadership dashboard endpoints:
// - Trends
// - Comparison
// - Rankings
// - Expenses

/// Trends Response Models
class TrendPeriod {
  final String periodId;
  final String startDate;
  final String endDate;
  final int activities;
  final double expenses;
  final double activeRate;
  final int activeUsers;
  final int totalUsers;

  const TrendPeriod({
    required this.periodId,
    required this.startDate,
    required this.endDate,
    required this.activities,
    required this.expenses,
    required this.activeRate,
    required this.activeUsers,
    required this.totalUsers,
  });

  factory TrendPeriod.fromApi(Map<String, dynamic> data) {
    return TrendPeriod(
      periodId: data['periodId'] as String? ?? '',
      startDate: data['startDate'] as String? ?? '',
      endDate: data['endDate'] as String? ?? '',
      activities: (data['activities'] as num?)?.toInt() ?? 0,
      expenses: (data['expenses'] as num?)?.toDouble() ?? 0.0,
      activeRate: (data['activeRate'] as num?)?.toDouble() ?? 0.0,
      activeUsers: (data['activeUsers'] as num?)?.toInt() ?? 0,
      totalUsers: (data['totalUsers'] as num?)?.toInt() ?? 0,
    );
  }
}

class TrendsResponse {
  final List<TrendPeriod> periods;

  const TrendsResponse({required this.periods});

  factory TrendsResponse.fromApi(Map<String, dynamic> data) {
    final periodsData = data['periods'] as List<dynamic>? ?? [];
    final periods = periodsData
        .map((period) => TrendPeriod.fromApi(period as Map<String, dynamic>))
        .toList();

    return TrendsResponse(periods: periods);
  }

  factory TrendsResponse.empty() {
    return const TrendsResponse(periods: []);
  }
}

/// Comparison Response Models
class PeriodSummary {
  final String periodId;
  final String dates;
  final int activities;
  final double expenses;
  final double activeRate;
  final int usersActive;

  const PeriodSummary({
    required this.periodId,
    required this.dates,
    required this.activities,
    required this.expenses,
    required this.activeRate,
    required this.usersActive,
  });

  factory PeriodSummary.fromApi(Map<String, dynamic> data) {
    return PeriodSummary(
      periodId: data['periodId'] as String? ?? '',
      dates: data['dates'] as String? ?? '',
      activities: (data['activities'] as num?)?.toInt() ?? 0,
      expenses: (data['expenses'] as num?)?.toDouble() ?? 0.0,
      activeRate: (data['activeRate'] as num?)?.toDouble() ?? 0.0,
      usersActive: (data['usersActive'] as num?)?.toInt() ?? 0,
    );
  }
}

class Change {
  final double value;
  final double percent;

  const Change({
    required this.value,
    required this.percent,
  });

  factory Change.fromApi(Map<String, dynamic> data) {
    return Change(
      value: (data['value'] as num?)?.toDouble() ?? 0.0,
      percent: (data['percent'] as num?)?.toDouble() ?? 0.0,
    );
  }

  bool get isPositive => value > 0;
  bool get isNegative => value < 0;
  bool get isNeutral => value == 0;
}

class ComparisonChanges {
  final Change activities;
  final Change expenses;
  final Change activeRate;
  final Change usersActive;

  const ComparisonChanges({
    required this.activities,
    required this.expenses,
    required this.activeRate,
    required this.usersActive,
  });

  factory ComparisonChanges.fromApi(Map<String, dynamic> data) {
    return ComparisonChanges(
      activities: Change.fromApi(data['activities'] as Map<String, dynamic>),
      expenses: Change.fromApi(data['expenses'] as Map<String, dynamic>),
      activeRate:
          Change.fromApi(data['activeRate'] as Map<String, dynamic>),
      usersActive: Change.fromApi(data['usersActive'] as Map<String, dynamic>),
    );
  }
}

class ComparisonResponse {
  final PeriodSummary current;
  final PeriodSummary previous;
  final ComparisonChanges changes;

  const ComparisonResponse({
    required this.current,
    required this.previous,
    required this.changes,
  });

  factory ComparisonResponse.fromApi(Map<String, dynamic> data) {
    return ComparisonResponse(
      current: PeriodSummary.fromApi(data['current'] as Map<String, dynamic>),
      previous: PeriodSummary.fromApi(data['previous'] as Map<String, dynamic>),
      changes:
          ComparisonChanges.fromApi(data['changes'] as Map<String, dynamic>),
    );
  }

  factory ComparisonResponse.empty() {
    return ComparisonResponse(
      current: PeriodSummary.fromApi(const {}),
      previous: PeriodSummary.fromApi(const {}),
      changes: ComparisonChanges.fromApi(const {
        'activities': {'value': 0.0, 'percent': 0.0},
        'expenses': {'value': 0.0, 'percent': 0.0},
        'activeRate': {'value': 0.0, 'percent': 0.0},
        'usersActive': {'value': 0.0, 'percent': 0.0},
      }),
    );
  }
}

/// Rankings Response Models
class TopPerformer {
  final String userId;
  final String name;
  final String entity;
  final int count;
  final double expenses;

  const TopPerformer({
    required this.userId,
    required this.name,
    required this.entity,
    required this.count,
    required this.expenses,
  });

  factory TopPerformer.fromApi(Map<String, dynamic> data) {
    return TopPerformer(
      userId: data['userId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      entity: data['entity'] as String? ?? '',
      count: (data['count'] as num?)?.toInt() ?? 0,
      expenses: (data['expenses'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class LowEngagement {
  final String entityId;
  final String name;
  final double rate;
  final int missing;

  const LowEngagement({
    required this.entityId,
    required this.name,
    required this.rate,
    required this.missing,
  });

  factory LowEngagement.fromApi(Map<String, dynamic> data) {
    return LowEngagement(
      entityId: data['entityId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      rate: (data['rate'] as num?)?.toDouble() ?? 0.0,
      missing: (data['missing'] as num?)?.toInt() ?? 0,
    );
  }
}

class InactiveUser {
  final String userId;
  final String name;
  final String entity;
  final int periodsInactive;

  const InactiveUser({
    required this.userId,
    required this.name,
    required this.entity,
    required this.periodsInactive,
  });

  factory InactiveUser.fromApi(Map<String, dynamic> data) {
    return InactiveUser(
      userId: data['userId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      entity: data['entity'] as String? ?? '',
      periodsInactive: (data['periodsInactive'] as num?)?.toInt() ?? 0,
    );
  }
}

class RankingsResponse {
  final List<TopPerformer> topPerformers;
  final List<LowEngagement> lowestEngagement;
  final List<InactiveUser> inactiveUsers;

  const RankingsResponse({
    required this.topPerformers,
    required this.lowestEngagement,
    required this.inactiveUsers,
  });

  factory RankingsResponse.fromApi(Map<String, dynamic> data) {
    final topPerformersData = data['topPerformers'] as List<dynamic>? ?? [];
    final topPerformers = topPerformersData
        .map((item) => TopPerformer.fromApi(item as Map<String, dynamic>))
        .toList();

    final lowestEngagementData =
        data['lowestEngagement'] as List<dynamic>? ?? [];
    final lowestEngagement = lowestEngagementData
        .map((item) => LowEngagement.fromApi(item as Map<String, dynamic>))
        .toList();

    final inactiveUsersData = data['inactiveUsers'] as List<dynamic>? ?? [];
    final inactiveUsers = inactiveUsersData
        .map((item) => InactiveUser.fromApi(item as Map<String, dynamic>))
        .toList();

    return RankingsResponse(
      topPerformers: topPerformers,
      lowestEngagement: lowestEngagement,
      inactiveUsers: inactiveUsers,
    );
  }

  factory RankingsResponse.empty() {
    return const RankingsResponse(
      topPerformers: [],
      lowestEngagement: [],
      inactiveUsers: [],
    );
  }
}

/// Expenses Response Models
class ExpenseByType {
  final String typeId;
  final String name;
  final double total;
  final double percent;
  final double avgPerActivity;

  const ExpenseByType({
    required this.typeId,
    required this.name,
    required this.total,
    required this.percent,
    required this.avgPerActivity,
  });

  factory ExpenseByType.fromApi(Map<String, dynamic> data) {
    return ExpenseByType(
      typeId: data['typeId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      total: (data['total'] as num?)?.toDouble() ?? 0.0,
      percent: (data['percent'] as num?)?.toDouble() ?? 0.0,
      avgPerActivity: (data['avgPerActivity'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ExpenseByEntity {
  final String entityId;
  final String name;
  final double total;
  final double percent;
  final double perUser;

  const ExpenseByEntity({
    required this.entityId,
    required this.name,
    required this.total,
    required this.percent,
    required this.perUser,
  });

  factory ExpenseByEntity.fromApi(Map<String, dynamic> data) {
    return ExpenseByEntity(
      entityId: data['entityId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      total: (data['total'] as num?)?.toDouble() ?? 0.0,
      percent: (data['percent'] as num?)?.toDouble() ?? 0.0,
      perUser: (data['perUser'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ExpenseByUser {
  final String userId;
  final String name;
  final double total;
  final double percent;

  const ExpenseByUser({
    required this.userId,
    required this.name,
    required this.total,
    required this.percent,
  });

  factory ExpenseByUser.fromApi(Map<String, dynamic> data) {
    return ExpenseByUser(
      userId: data['userId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      total: (data['total'] as num?)?.toDouble() ?? 0.0,
      percent: (data['percent'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ExpensesResponse {
  final double total;
  final List<ExpenseByType> byType;
  final List<ExpenseByEntity> byEntity;
  final List<ExpenseByUser> byUser;

  const ExpensesResponse({
    required this.total,
    required this.byType,
    required this.byEntity,
    required this.byUser,
  });

  factory ExpensesResponse.fromApi(Map<String, dynamic> data) {
    final byTypeData = data['byType'] as List<dynamic>? ?? [];
    final byType = byTypeData
        .map((item) => ExpenseByType.fromApi(item as Map<String, dynamic>))
        .toList();

    final byEntityData = data['byEntity'] as List<dynamic>? ?? [];
    final byEntity = byEntityData
        .map((item) => ExpenseByEntity.fromApi(item as Map<String, dynamic>))
        .toList();

    final byUserData = data['byUser'] as List<dynamic>? ?? [];
    final byUser = byUserData
        .map((item) => ExpenseByUser.fromApi(item as Map<String, dynamic>))
        .toList();

    return ExpensesResponse(
      total: (data['total'] as num?)?.toDouble() ?? 0.0,
      byType: byType,
      byEntity: byEntity,
      byUser: byUser,
    );
  }

  factory ExpensesResponse.empty() {
    return const ExpensesResponse(
      total: 0.0,
      byType: [],
      byEntity: [],
      byUser: [],
    );
  }
}

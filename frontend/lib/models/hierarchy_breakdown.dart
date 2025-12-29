import 'entity_hierarchy.dart';

/// Per-entity breakdown for hierarchical reports
class HierarchyEntityBreakdown {
  final String entityId;
  final String entityName;
  final EntityType entityType;
  final String? parentId;
  final int activities;
  final double expenses;
  final int usersExpected;
  final int usersSubmitted;
  final double complianceRate;

  const HierarchyEntityBreakdown({
    required this.entityId,
    required this.entityName,
    required this.entityType,
    this.parentId,
    required this.activities,
    required this.expenses,
    required this.usersExpected,
    required this.usersSubmitted,
    required this.complianceRate,
  });

  factory HierarchyEntityBreakdown.fromApi(Map<String, dynamic> data) {
    return HierarchyEntityBreakdown(
      entityId: data['entityId'] as String,
      entityName: data['entityName'] as String,
      entityType: EntityType.fromString(data['entityType'] as String? ?? 'FIELD'),
      parentId: data['parentId'] as String?,
      activities: (data['activities'] as num?)?.toInt() ?? 0,
      expenses: (data['expenses'] as num?)?.toDouble() ?? 0.0,
      usersExpected: (data['usersExpected'] as num?)?.toInt() ?? 0,
      usersSubmitted: (data['usersSubmitted'] as num?)?.toInt() ?? 0,
      complianceRate: (data['complianceRate'] as num?)?.toDouble() ?? 0.0,
    );
  }

  /// Compliance rate as a percentage (0-100)
  double get compliancePercent => complianceRate * 100;

  /// Formatted compliance rate for display
  String get complianceDisplay => '${compliancePercent.toStringAsFixed(0)}%';
}

/// Extended summary response that includes hierarchy breakdown
class HierarchySummaryResponse {
  final String periodId;
  final String periodStart;
  final String periodEnd;
  final String periodStatus;
  final String scope;
  final String entityId;
  final String entityName;
  final String entityType;
  final int totalActivities;
  final double totalExpenses;
  final int usersExpected;
  final int usersSubmitted;
  final double complianceRate;
  final List<HierarchyEntityBreakdown> hierarchyBreakdown;

  const HierarchySummaryResponse({
    required this.periodId,
    required this.periodStart,
    required this.periodEnd,
    required this.periodStatus,
    required this.scope,
    required this.entityId,
    required this.entityName,
    required this.entityType,
    required this.totalActivities,
    required this.totalExpenses,
    required this.usersExpected,
    required this.usersSubmitted,
    required this.complianceRate,
    required this.hierarchyBreakdown,
  });

  factory HierarchySummaryResponse.fromApi(Map<String, dynamic> data) {
    final period = data['period'] as Map<String, dynamic>? ?? {};
    final entity = data['entity'] as Map<String, dynamic>? ?? {};
    final totals = data['totals'] as Map<String, dynamic>? ?? {};
    final breakdownData = data['hierarchyBreakdown'] as List<dynamic>? ?? [];

    return HierarchySummaryResponse(
      periodId: period['id'] as String? ?? '',
      periodStart: period['startDate'] as String? ?? '',
      periodEnd: period['endDate'] as String? ?? '',
      periodStatus: period['status'] as String? ?? 'active',
      scope: data['scope'] as String? ?? 'entity',
      entityId: entity['id'] as String? ?? '',
      entityName: entity['name'] as String? ?? '',
      entityType: entity['type'] as String? ?? '',
      totalActivities: (totals['activities'] as num?)?.toInt() ?? 0,
      totalExpenses: (totals['expenses'] as num?)?.toDouble() ?? 0.0,
      usersExpected: (totals['usersExpected'] as num?)?.toInt() ?? 0,
      usersSubmitted: (totals['usersSubmitted'] as num?)?.toInt() ?? 0,
      complianceRate: (totals['complianceRate'] as num?)?.toDouble() ?? 0.0,
      hierarchyBreakdown: breakdownData
          .map((item) => HierarchyEntityBreakdown.fromApi(item as Map<String, dynamic>))
          .toList(),
    );
  }

  factory HierarchySummaryResponse.empty() {
    return const HierarchySummaryResponse(
      periodId: '',
      periodStart: '',
      periodEnd: '',
      periodStatus: 'active',
      scope: 'entity',
      entityId: '',
      entityName: '',
      entityType: '',
      totalActivities: 0,
      totalExpenses: 0.0,
      usersExpected: 0,
      usersSubmitted: 0,
      complianceRate: 0.0,
      hierarchyBreakdown: [],
    );
  }

  /// Compliance rate as a percentage (0-100)
  double get compliancePercent => complianceRate * 100;

  /// Returns true if the summary includes hierarchy breakdown
  bool get hasHierarchyBreakdown => hierarchyBreakdown.isNotEmpty;
}

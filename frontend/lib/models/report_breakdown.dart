enum GrowthDirection {
  positive,
  negative,
  neutral,
}

class ReportBreakdown {
  final String activityTypeName;
  final int count;
  final double totalExpenses;

  const ReportBreakdown({
    required this.activityTypeName,
    required this.count,
    required this.totalExpenses,
  });

  factory ReportBreakdown.fromApi(Map<String, dynamic> data) {
    return ReportBreakdown(
      activityTypeName: data['name'] as String? ?? '',
      count: (data['count'] as num?)?.toInt() ?? 0,
      totalExpenses: (data['expenses'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class ChangeValue {
  final double value;
  final double percent;

  const ChangeValue({
    required this.value,
    required this.percent,
  });

  factory ChangeValue.fromApi(Map<String, dynamic> data) {
    return ChangeValue(
      value: (data['value'] as num?)?.toDouble() ?? 0.0,
      percent: (data['percent'] as num?)?.toDouble() ?? 0.0,
    );
  }

  String get formattedValue {
    final sign = value >= 0 ? '+' : '';
    if (value == value.truncate()) {
      return '$sign${value.toInt()}';
    }
    return '$sign${value.toStringAsFixed(2)}';
  }

  String get formattedPercent {
    final sign = percent >= 0 ? '+' : '';
    return '$sign${percent.toStringAsFixed(1)}%';
  }

  String get formatted => '$formattedValue ($formattedPercent)';
}

class ReportBreakdownChange {
  final ChangeValue count;
  final ChangeValue expenses;

  const ReportBreakdownChange({
    required this.count,
    required this.expenses,
  });

  factory ReportBreakdownChange.fromApi(Map<String, dynamic> data) {
    return ReportBreakdownChange(
      count: ChangeValue.fromApi(data['count'] as Map<String, dynamic>? ?? {}),
      expenses:
          ChangeValue.fromApi(data['expenses'] as Map<String, dynamic>? ?? {}),
    );
  }
}

class ReportBreakdownWithComparison {
  final String typeId;
  final String activityTypeName;
  final int count;
  final double totalExpenses;
  final int? previousCount;
  final double? previousExpenses;
  final ReportBreakdownChange? change;
  final GrowthDirection growthDirection;

  const ReportBreakdownWithComparison({
    required this.typeId,
    required this.activityTypeName,
    required this.count,
    required this.totalExpenses,
    this.previousCount,
    this.previousExpenses,
    this.change,
    required this.growthDirection,
  });

  factory ReportBreakdownWithComparison.fromApi(Map<String, dynamic> data) {
    final previous = data['previous'] as Map<String, dynamic>?;
    final changeData = data['change'] as Map<String, dynamic>?;
    final growthStr = data['growthDirection'] as String? ?? 'positive';

    return ReportBreakdownWithComparison(
      typeId: data['typeId'] as String? ?? '',
      activityTypeName: data['name'] as String? ?? '',
      count: (data['count'] as num?)?.toInt() ?? 0,
      totalExpenses: (data['expenses'] as num?)?.toDouble() ?? 0.0,
      previousCount: (previous?['count'] as num?)?.toInt(),
      previousExpenses: (previous?['expenses'] as num?)?.toDouble(),
      change:
          changeData != null ? ReportBreakdownChange.fromApi(changeData) : null,
      growthDirection: GrowthDirection.values.firstWhere(
        (e) => e.name == growthStr,
        orElse: () => GrowthDirection.positive,
      ),
    );
  }

  bool get isCountGrowthPositive {
    if (change == null) return true;
    if (growthDirection == GrowthDirection.positive) {
      return change!.count.value >= 0;
    } else if (growthDirection == GrowthDirection.negative) {
      return change!.count.value <= 0;
    }
    return true;
  }

  bool get isExpensesGrowthPositive {
    if (change == null) return true;
    // Expenses growth is generally negative (less is better)
    // But we follow the activity type's growth direction
    if (growthDirection == GrowthDirection.positive) {
      return change!.expenses.value >= 0;
    } else if (growthDirection == GrowthDirection.negative) {
      return change!.expenses.value <= 0;
    }
    return true;
  }
}

class BreakdownsComparisonPeriodInfo {
  final String periodLabel;
  final String dateFrom;
  final String dateTo;

  const BreakdownsComparisonPeriodInfo({
    required this.periodLabel,
    required this.dateFrom,
    required this.dateTo,
  });

  factory BreakdownsComparisonPeriodInfo.fromApi(Map<String, dynamic> data) {
    return BreakdownsComparisonPeriodInfo(
      periodLabel: data['periodLabel'] as String? ?? '',
      dateFrom: data['dateFrom'] as String? ?? '',
      dateTo: data['dateTo'] as String? ?? '',
    );
  }
}

class BreakdownsComparisonTotals {
  final int currentCount;
  final double currentExpenses;
  final int? previousCount;
  final double? previousExpenses;
  final ReportBreakdownChange? change;

  const BreakdownsComparisonTotals({
    required this.currentCount,
    required this.currentExpenses,
    this.previousCount,
    this.previousExpenses,
    this.change,
  });

  factory BreakdownsComparisonTotals.fromApi(Map<String, dynamic> data) {
    final current = data['current'] as Map<String, dynamic>? ?? {};
    final previous = data['previous'] as Map<String, dynamic>?;
    final changeData = data['change'] as Map<String, dynamic>?;

    return BreakdownsComparisonTotals(
      currentCount: (current['count'] as num?)?.toInt() ?? 0,
      currentExpenses: (current['expenses'] as num?)?.toDouble() ?? 0.0,
      previousCount: (previous?['count'] as num?)?.toInt(),
      previousExpenses: (previous?['expenses'] as num?)?.toDouble(),
      change:
          changeData != null ? ReportBreakdownChange.fromApi(changeData) : null,
    );
  }
}

class BreakdownsComparisonResponse {
  final BreakdownsComparisonPeriodInfo currentPeriod;
  final BreakdownsComparisonPeriodInfo? previousPeriod;
  final List<ReportBreakdownWithComparison> byType;
  final BreakdownsComparisonTotals totals;

  const BreakdownsComparisonResponse({
    required this.currentPeriod,
    this.previousPeriod,
    required this.byType,
    required this.totals,
  });

  factory BreakdownsComparisonResponse.fromApi(Map<String, dynamic> data) {
    final current = data['current'] as Map<String, dynamic>? ?? {};
    final previous = data['previous'] as Map<String, dynamic>?;
    final byTypeList = current['byType'] as List<dynamic>? ?? [];
    final totalsData = data['totals'] as Map<String, dynamic>? ?? {};

    return BreakdownsComparisonResponse(
      currentPeriod: BreakdownsComparisonPeriodInfo.fromApi(current),
      previousPeriod: previous != null
          ? BreakdownsComparisonPeriodInfo.fromApi(previous)
          : null,
      byType: byTypeList
          .map((item) => ReportBreakdownWithComparison.fromApi(
              item as Map<String, dynamic>))
          .toList(),
      totals: BreakdownsComparisonTotals.fromApi(totalsData),
    );
  }
}

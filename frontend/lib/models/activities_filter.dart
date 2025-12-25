import 'package:flutter/material.dart';

class ActivitiesFilter {
  final DateTime? startDate;
  final DateTime? endDate;
  final String? activityTypeId;
  final bool? hasExpense;

  const ActivitiesFilter({
    this.startDate,
    this.endDate,
    this.activityTypeId,
    this.hasExpense,
  });

  ActivitiesFilter copyWith({
    DateTime? startDate,
    DateTime? endDate,
    String? activityTypeId,
    bool? hasExpense,
    bool clearStartDate = false,
    bool clearEndDate = false,
    bool clearActivityType = false,
    bool clearHasExpense = false,
  }) {
    return ActivitiesFilter(
      startDate: clearStartDate ? null : (startDate ?? this.startDate),
      endDate: clearEndDate ? null : (endDate ?? this.endDate),
      activityTypeId:
          clearActivityType ? null : (activityTypeId ?? this.activityTypeId),
      hasExpense: clearHasExpense ? null : (hasExpense ?? this.hasExpense),
    );
  }

  Map<String, String> toQueryParams() {
    final params = <String, String>{};
    if (startDate != null) {
      params['startDate'] = startDate!.toIso8601String().split('T').first;
    }
    if (endDate != null) {
      params['endDate'] = endDate!.toIso8601String().split('T').first;
    }
    if (activityTypeId != null) {
      params['activityTypeId'] = activityTypeId!;
    }
    if (hasExpense != null) {
      params['hasExpense'] = hasExpense.toString();
    }
    return params;
  }
}

enum TimePreset {
  last7Days,
  thisMonth,
  lastMonth,
  last3Months,
  thisYear,
  custom,
}

extension TimePresetExtension on TimePreset {
  String get label {
    switch (this) {
      case TimePreset.last7Days:
        return 'Últimos 7 días';
      case TimePreset.thisMonth:
        return 'Este mes';
      case TimePreset.lastMonth:
        return 'Mes pasado';
      case TimePreset.last3Months:
        return 'Últimos 3 meses';
      case TimePreset.thisYear:
        return 'Este año';
      case TimePreset.custom:
        return 'Personalizado';
    }
  }

  DateTimeRange getRange() {
    final now = DateTime.now();
    switch (this) {
      case TimePreset.last7Days:
        return DateTimeRange(
          start: now.subtract(const Duration(days: 7)),
          end: now,
        );
      case TimePreset.thisMonth:
        return DateTimeRange(
          start: DateTime(now.year, now.month, 1),
          end: DateTime(now.year, now.month + 1, 0),
        );
      case TimePreset.lastMonth:
        return DateTimeRange(
          start: DateTime(now.year, now.month - 1, 1),
          end: DateTime(now.year, now.month, 0),
        );
      case TimePreset.last3Months:
        return DateTimeRange(
          start: DateTime(now.year, now.month - 2, 1),
          end: now,
        );
      case TimePreset.thisYear:
        return DateTimeRange(
          start: DateTime(now.year, 1, 1),
          end: DateTime(now.year, 12, 31),
        );
      case TimePreset.custom:
        return DateTimeRange(start: now, end: now);
    }
  }
}

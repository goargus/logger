import 'package:flutter/material.dart';

class ActivitiesFilter {
  final DateTime? startDate;
  final DateTime? endDate;
  final String? activityTypeId;
  final bool? hasExpense;
  final String? search;

  const ActivitiesFilter({
    this.startDate,
    this.endDate,
    this.activityTypeId,
    this.hasExpense,
    this.search,
  });

  ActivitiesFilter copyWith({
    DateTime? startDate,
    DateTime? endDate,
    String? activityTypeId,
    bool? hasExpense,
    String? search,
    bool clearStartDate = false,
    bool clearEndDate = false,
    bool clearActivityType = false,
    bool clearHasExpense = false,
    bool clearSearch = false,
  }) {
    return ActivitiesFilter(
      startDate: clearStartDate ? null : (startDate ?? this.startDate),
      endDate: clearEndDate ? null : (endDate ?? this.endDate),
      activityTypeId:
          clearActivityType ? null : (activityTypeId ?? this.activityTypeId),
      hasExpense: clearHasExpense ? null : (hasExpense ?? this.hasExpense),
      search: clearSearch ? null : (search ?? this.search),
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
    if (search != null && search!.trim().isNotEmpty) {
      params['search'] = search!.trim();
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

  DateTimeRange getRange({DateTime? now}) {
    final current = now ?? DateTime.now();
    final today = DateTime(current.year, current.month, current.day);
    switch (this) {
      case TimePreset.last7Days:
        final end = today;
        final start = end.subtract(const Duration(days: 6));
        return DateTimeRange(
          start: start,
          end: end,
        );
      case TimePreset.thisMonth:
        return DateTimeRange(
          start: DateTime(current.year, current.month, 1),
          end: today,
        );
      case TimePreset.lastMonth:
        return DateTimeRange(
          start: DateTime(current.year, current.month - 1, 1),
          end: DateTime(current.year, current.month, 0),
        );
      case TimePreset.last3Months:
        final end = today;
        final start = DateTime(current.year, current.month - 2, 1);
        return DateTimeRange(
          start: start,
          end: end,
        );
      case TimePreset.thisYear:
        return DateTimeRange(
          start: DateTime(current.year, 1, 1),
          end: today,
        );
      case TimePreset.custom:
        return DateTimeRange(start: today, end: today);
    }
  }
}

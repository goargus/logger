class DateRange {
  final String startDate;
  final String endDate;

  DateRange({required this.startDate, required this.endDate});

  factory DateRange.fromJson(Map<String, dynamic> json) {
    return DateRange(
      startDate: json['startDate'] as String,
      endDate: json['endDate'] as String,
    );
  }

  bool containsDate(String dateStr) {
    return dateStr.compareTo(startDate) >= 0 && dateStr.compareTo(endDate) <= 0;
  }

  bool containsDateTime(DateTime date) {
    final dateStr =
        '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    return containsDate(dateStr);
  }
}

class AvailabilityResponse {
  final DateRange? currentPeriod;
  final List<DateRange> availableDates;

  AvailabilityResponse(
      {required this.currentPeriod, required this.availableDates});

  factory AvailabilityResponse.fromJson(Map<String, dynamic> json) {
    return AvailabilityResponse(
      currentPeriod: json['currentPeriod'] != null
          ? DateRange.fromJson(json['currentPeriod'] as Map<String, dynamic>)
          : null,
      availableDates: (json['availableDates'] as List<dynamic>)
          .map((e) => DateRange.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  bool isDateAvailable(DateTime date) {
    return availableDates.any((range) => range.containsDateTime(date));
  }
}

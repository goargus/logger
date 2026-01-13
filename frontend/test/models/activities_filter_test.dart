import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/activities_filter.dart';

void main() {
  group('TimePreset.getRange', () {
    final reference = DateTime(2024, 3, 15, 10, 30);

    test('last7Days includes today and previous 6 days', () {
      final range = TimePreset.last7Days.getRange(now: reference);
      expect(range.start, DateTime(2024, 3, 9));
      expect(range.end, DateTime(2024, 3, 15));
    });

    test('thisMonth starts at first day and ends today', () {
      final range = TimePreset.thisMonth.getRange(now: reference);
      expect(range.start, DateTime(2024, 3, 1));
      expect(range.end, DateTime(2024, 3, 15));
    });

    test('lastMonth covers the full previous calendar month', () {
      final range = TimePreset.lastMonth.getRange(now: reference);
      expect(range.start, DateTime(2024, 2, 1));
      expect(range.end, DateTime(2024, 2, 29));
    });

    test('last3Months includes current and two previous months', () {
      final range = TimePreset.last3Months.getRange(now: reference);
      expect(range.start, DateTime(2024, 1, 1));
      expect(range.end, DateTime(2024, 3, 15));
    });

    test('thisYear starts on Jan 1 and ends today', () {
      final range = TimePreset.thisYear.getRange(now: reference);
      expect(range.start, DateTime(2024, 1, 1));
      expect(range.end, DateTime(2024, 3, 15));
    });

    test('custom defaults to today', () {
      final range = TimePreset.custom.getRange(now: reference);
      expect(range.start, DateTime(2024, 3, 15));
      expect(range.end, DateTime(2024, 3, 15));
    });
  });
}

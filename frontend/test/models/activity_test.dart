import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/activity.dart';

void main() {
  group('Activity', () {
    group('fromApi', () {
      test('should correctly parse activity from API data', () {
        final apiData = {
          'id': 'activity-123',
          'activityDate': '2024-01-15T10:30:00.000Z',
          'activityTypeName': 'Meeting',
          'description': 'Team standup',
          'expenseAmount': '150.50',
          'ownerUserId': 'user-987',
          'ownerUsername': 'maria.gomez',
        };

        final activity = Activity.fromApi(apiData);

        expect(activity.id, 'activity-123');
        expect(activity.date, DateTime.parse('2024-01-15T10:30:00.000Z'));
        expect(activity.category, 'Meeting');
        expect(activity.description, 'Team standup');
        expect(activity.expense, 150.50);
        expect(activity.ownerUserId, 'user-987');
        expect(activity.ownerUsername, 'maria.gomez');
      });

      test('should handle null id', () {
        final apiData = {
          'activityDate': '2024-01-15T10:30:00.000Z',
          'activityTypeName': 'Meeting',
          'description': 'Team standup',
          'expenseAmount': '0',
        };

        final activity = Activity.fromApi(apiData);

        expect(activity.id, isNull);
      });

      test('should use default category when activityTypeName is missing', () {
        final apiData = {
          'id': 'activity-123',
          'activityDate': '2024-01-15T10:30:00.000Z',
          'description': 'Team standup',
          'expenseAmount': '0',
        };

        final activity = Activity.fromApi(apiData);

        expect(activity.category, 'Actividad');
      });

      test('should use empty description when missing', () {
        final apiData = {
          'id': 'activity-123',
          'activityDate': '2024-01-15T10:30:00.000Z',
          'activityTypeName': 'Meeting',
          'expenseAmount': '0',
        };

        final activity = Activity.fromApi(apiData);

        expect(activity.description, '');
      });

      test('should handle null expenseAmount', () {
        final apiData = {
          'id': 'activity-123',
          'activityDate': '2024-01-15T10:30:00.000Z',
          'activityTypeName': 'Meeting',
          'description': 'Team standup',
        };

        final activity = Activity.fromApi(apiData);

        expect(activity.expense, 0.0);
      });

      test('should handle invalid expenseAmount string', () {
        final apiData = {
          'id': 'activity-123',
          'activityDate': '2024-01-15T10:30:00.000Z',
          'activityTypeName': 'Meeting',
          'description': 'Team standup',
          'expenseAmount': 'invalid',
        };

        final activity = Activity.fromApi(apiData);

        expect(activity.expense, 0.0);
      });

      test('should parse decimal expenses correctly', () {
        final apiData = {
          'id': 'activity-123',
          'activityDate': '2024-01-15T10:30:00.000Z',
          'activityTypeName': 'Meeting',
          'description': 'Team standup',
          'expenseAmount': '99.99',
        };

        final activity = Activity.fromApi(apiData);

        expect(activity.expense, 99.99);
      });
    });
  });
}

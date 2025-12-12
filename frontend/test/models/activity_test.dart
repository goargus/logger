import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/activity.dart';

void main() {
  group('Activity', () {
    group('fromApi', () {
      test('should correctly parse activity from API data', () {
        // Arrange
        final apiData = {
          'id': 'activity-123',
          'activityDate': '2024-01-15T10:30:00.000Z',
          'activityTypeName': 'Meeting',
          'description': 'Team standup',
          'expenseAmount': '150.50',
        };

        // Act
        final activity = Activity.fromApi(apiData);

        // Assert
        expect(activity.id, 'activity-123');
        expect(activity.date, DateTime.parse('2024-01-15T10:30:00.000Z'));
        expect(activity.category, 'Meeting');
        expect(activity.description, 'Team standup');
        expect(activity.expense, 150.50);
      });

      test('should handle null id', () {
        // Arrange
        final apiData = {
          'activityDate': '2024-01-15T10:30:00.000Z',
          'activityTypeName': 'Meeting',
          'description': 'Team standup',
          'expenseAmount': '0',
        };

        // Act
        final activity = Activity.fromApi(apiData);

        // Assert
        expect(activity.id, isNull);
      });

      test('should use default category when activityTypeName is missing', () {
        // Arrange
        final apiData = {
          'id': 'activity-123',
          'activityDate': '2024-01-15T10:30:00.000Z',
          'description': 'Team standup',
          'expenseAmount': '0',
        };

        // Act
        final activity = Activity.fromApi(apiData);

        // Assert
        expect(activity.category, 'Actividad');
      });

      test('should use empty description when missing', () {
        // Arrange
        final apiData = {
          'id': 'activity-123',
          'activityDate': '2024-01-15T10:30:00.000Z',
          'activityTypeName': 'Meeting',
          'expenseAmount': '0',
        };

        // Act
        final activity = Activity.fromApi(apiData);

        // Assert
        expect(activity.description, '');
      });

      test('should handle null expenseAmount', () {
        // Arrange
        final apiData = {
          'id': 'activity-123',
          'activityDate': '2024-01-15T10:30:00.000Z',
          'activityTypeName': 'Meeting',
          'description': 'Team standup',
        };

        // Act
        final activity = Activity.fromApi(apiData);

        // Assert
        expect(activity.expense, 0.0);
      });

      test('should handle invalid expenseAmount string', () {
        // Arrange
        final apiData = {
          'id': 'activity-123',
          'activityDate': '2024-01-15T10:30:00.000Z',
          'activityTypeName': 'Meeting',
          'description': 'Team standup',
          'expenseAmount': 'invalid',
        };

        // Act
        final activity = Activity.fromApi(apiData);

        // Assert
        expect(activity.expense, 0.0);
      });

      test('should parse decimal expenses correctly', () {
        // Arrange
        final apiData = {
          'id': 'activity-123',
          'activityDate': '2024-01-15T10:30:00.000Z',
          'activityTypeName': 'Meeting',
          'description': 'Team standup',
          'expenseAmount': '99.99',
        };

        // Act
        final activity = Activity.fromApi(apiData);

        // Assert
        expect(activity.expense, 99.99);
      });
    });
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/activity_type.dart';

void main() {
  group('ActivityType', () {
    group('fromJson', () {
      test('should correctly parse activity type from JSON', () {
        final json = {
          'id': 'type-123',
          'name': 'Meeting',
          'description': 'Team meetings and standups',
        };

        final activityType = ActivityType.fromJson(json);

        expect(activityType.id, 'type-123');
        expect(activityType.name, 'Meeting');
        expect(activityType.description, 'Team meetings and standups');
      });

      test('should handle empty strings', () {
        final json = {
          'id': '',
          'name': '',
          'description': '',
        };

        final activityType = ActivityType.fromJson(json);

        expect(activityType.id, '');
        expect(activityType.name, '');
        expect(activityType.description, '');
      });

      test('should create activity type with all required fields', () {
        final json = {
          'id': 'type-456',
          'name': 'Training',
          'description': 'Professional development activities',
        };

        final activityType = ActivityType.fromJson(json);

        expect(activityType.id, isNotEmpty);
        expect(activityType.name, isNotEmpty);
        expect(activityType.description, isNotEmpty);
      });
    });

    group('constructor', () {
      test('should create activity type with valid data', () {
        final activityType = ActivityType(
          id: 'type-789',
          name: 'Conference',
          description: 'Industry conferences and events',
        );

        expect(activityType.id, 'type-789');
        expect(activityType.name, 'Conference');
        expect(activityType.description, 'Industry conferences and events');
      });
    });
  });
}

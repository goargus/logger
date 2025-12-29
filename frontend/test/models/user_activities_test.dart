import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/user_activities.dart';

void main() {
  group('UserActivity', () {
    group('fromApi', () {
      test('should parse all fields correctly', () {
        final activity = UserActivity.fromApi({
          'id': 'act-123',
          'date': '2024-01-15',
          'typeName': 'Meeting',
          'typeId': 'type-1',
          'description': 'Team standup',
          'hasExpense': true,
          'expenseAmount': '150.50',
          'status': 'active',
          'createdAt': '2024-01-15T10:00:00Z',
        });

        expect(activity.id, 'act-123');
        expect(activity.date, '2024-01-15');
        expect(activity.typeName, 'Meeting');
        expect(activity.typeId, 'type-1');
        expect(activity.description, 'Team standup');
        expect(activity.hasExpense, isTrue);
        expect(activity.expenseAmount, '150.50');
        expect(activity.status, 'active');
      });

      test('should handle null description', () {
        final activity = UserActivity.fromApi({
          'id': 'act-123',
          'date': '2024-01-15',
          'typeName': 'Meeting',
          'typeId': 'type-1',
          'hasExpense': false,
          'status': 'active',
          'createdAt': '2024-01-15T10:00:00Z',
        });

        expect(activity.description, isNull);
      });

      test('should handle null expenseAmount', () {
        final activity = UserActivity.fromApi({
          'id': 'act-123',
          'date': '2024-01-15',
          'typeName': 'Meeting',
          'typeId': 'type-1',
          'hasExpense': false,
          'status': 'active',
          'createdAt': '2024-01-15T10:00:00Z',
        });

        expect(activity.expenseAmount, isNull);
      });
    });

    group('expenseAmountValue', () {
      test('should return parsed expense amount', () {
        final activity = UserActivity.fromApi({
          'id': 'act-123',
          'date': '2024-01-15',
          'typeName': 'Meeting',
          'typeId': 'type-1',
          'hasExpense': true,
          'expenseAmount': '150.50',
          'status': 'active',
          'createdAt': '2024-01-15T10:00:00Z',
        });

        expect(activity.expenseAmountValue, 150.50);
      });

      test('should return 0 when hasExpense is false', () {
        final activity = UserActivity.fromApi({
          'id': 'act-123',
          'date': '2024-01-15',
          'typeName': 'Meeting',
          'typeId': 'type-1',
          'hasExpense': false,
          'expenseAmount': '150.50',
          'status': 'active',
          'createdAt': '2024-01-15T10:00:00Z',
        });

        expect(activity.expenseAmountValue, 0.0);
      });

      test('should return 0 when expenseAmount is null', () {
        final activity = UserActivity.fromApi({
          'id': 'act-123',
          'date': '2024-01-15',
          'typeName': 'Meeting',
          'typeId': 'type-1',
          'hasExpense': true,
          'status': 'active',
          'createdAt': '2024-01-15T10:00:00Z',
        });

        expect(activity.expenseAmountValue, 0.0);
      });

      test('should return 0 when expenseAmount is invalid', () {
        final activity = UserActivity.fromApi({
          'id': 'act-123',
          'date': '2024-01-15',
          'typeName': 'Meeting',
          'typeId': 'type-1',
          'hasExpense': true,
          'expenseAmount': 'invalid',
          'status': 'active',
          'createdAt': '2024-01-15T10:00:00Z',
        });

        expect(activity.expenseAmountValue, 0.0);
      });
    });

    group('grouping by type', () {
      UserActivity createActivity(String typeName,
          {bool hasExpense = false, String? expenseAmount}) {
        return UserActivity.fromApi({
          'id': 'act-${DateTime.now().microsecondsSinceEpoch}',
          'date': '2024-01-15',
          'typeName': typeName,
          'typeId': 'type-1',
          'hasExpense': hasExpense,
          'expenseAmount': expenseAmount,
          'status': 'active',
          'createdAt': '2024-01-15T10:00:00Z',
        });
      }

      test('should group activities by typeName', () {
        final activities = [
          createActivity('Meeting'),
          createActivity('Meeting'),
          createActivity('Meeting'),
          createActivity('Training'),
          createActivity('Training'),
          createActivity('Report'),
        ];

        final grouped = <String, int>{};
        for (final activity in activities) {
          grouped[activity.typeName] = (grouped[activity.typeName] ?? 0) + 1;
        }

        expect(grouped['Meeting'], 3);
        expect(grouped['Training'], 2);
        expect(grouped['Report'], 1);
      });

      test('should accumulate expenses by type', () {
        final activities = [
          createActivity('Meeting', hasExpense: true, expenseAmount: '100.00'),
          createActivity('Meeting', hasExpense: true, expenseAmount: '150.50'),
          createActivity('Training', hasExpense: true, expenseAmount: '500.00'),
          createActivity('Report', hasExpense: false),
        ];

        final expensesByType = <String, double>{};
        for (final activity in activities) {
          expensesByType[activity.typeName] =
              (expensesByType[activity.typeName] ?? 0) +
                  activity.expenseAmountValue;
        }

        expect(expensesByType['Meeting'], 250.50);
        expect(expensesByType['Training'], 500.00);
        expect(expensesByType['Report'], 0.0);
      });

      test('should sort grouped counts descending', () {
        final activities = [
          createActivity('Low'),
          createActivity('High'),
          createActivity('High'),
          createActivity('High'),
          createActivity('Medium'),
          createActivity('Medium'),
        ];

        final grouped = <String, int>{};
        for (final activity in activities) {
          grouped[activity.typeName] = (grouped[activity.typeName] ?? 0) + 1;
        }

        final sorted = grouped.entries.toList()
          ..sort((a, b) => b.value.compareTo(a.value));

        expect(sorted[0].key, 'High');
        expect(sorted[0].value, 3);
        expect(sorted[1].key, 'Medium');
        expect(sorted[1].value, 2);
        expect(sorted[2].key, 'Low');
        expect(sorted[2].value, 1);
      });
    });
  });

  group('UserInfo', () {
    test('should parse all fields correctly', () {
      final user = UserInfo.fromApi({
        'id': 'user-123',
        'name': 'John Doe',
        'email': 'john@example.com',
        'entityName': 'Main Office',
        'entityType': 'FIELD',
        'roleName': 'Missionary',
      });

      expect(user.id, 'user-123');
      expect(user.name, 'John Doe');
      expect(user.email, 'john@example.com');
      expect(user.entityName, 'Main Office');
      expect(user.entityType, 'FIELD');
      expect(user.roleName, 'Missionary');
    });
  });

  group('UserActivitiesTotals', () {
    test('should parse totals correctly', () {
      final totals = UserActivitiesTotals.fromApi({
        'count': 15,
        'expenses': 1500.50,
      });

      expect(totals.count, 15);
      expect(totals.expenses, 1500.50);
    });

    test('should handle integer expenses', () {
      final totals = UserActivitiesTotals.fromApi({
        'count': 10,
        'expenses': 1000,
      });

      expect(totals.expenses, 1000.0);
    });
  });

  group('UserActivitiesPagination', () {
    test('should parse pagination correctly', () {
      final pagination = UserActivitiesPagination.fromApi({
        'page': 2,
        'limit': 20,
        'total': 100,
        'totalPages': 5,
      });

      expect(pagination.page, 2);
      expect(pagination.limit, 20);
      expect(pagination.total, 100);
      expect(pagination.totalPages, 5);
    });

    test('hasNextPage should be true when page < totalPages', () {
      final pagination = UserActivitiesPagination.fromApi({
        'page': 2,
        'limit': 20,
        'total': 100,
        'totalPages': 5,
      });

      expect(pagination.hasNextPage, isTrue);
    });

    test('hasNextPage should be false when page == totalPages', () {
      final pagination = UserActivitiesPagination.fromApi({
        'page': 5,
        'limit': 20,
        'total': 100,
        'totalPages': 5,
      });

      expect(pagination.hasNextPage, isFalse);
    });

    test('hasPreviousPage should be true when page > 1', () {
      final pagination = UserActivitiesPagination.fromApi({
        'page': 2,
        'limit': 20,
        'total': 100,
        'totalPages': 5,
      });

      expect(pagination.hasPreviousPage, isTrue);
    });

    test('hasPreviousPage should be false when page == 1', () {
      final pagination = UserActivitiesPagination.fromApi({
        'page': 1,
        'limit': 20,
        'total': 100,
        'totalPages': 5,
      });

      expect(pagination.hasPreviousPage, isFalse);
    });
  });

  group('UserActivitiesResponse', () {
    test('isEmpty should be true when activities list is empty', () {
      final response = UserActivitiesResponse.empty();
      expect(response.isEmpty, isTrue);
    });

    test('isEmpty should be false when activities list has items', () {
      final response = UserActivitiesResponse.fromApi({
        'user': {
          'id': 'user-123',
          'name': 'John Doe',
          'email': 'john@example.com',
          'entityName': 'Main Office',
          'entityType': 'FIELD',
          'roleName': 'Missionary',
        },
        'activities': [
          {
            'id': 'act-123',
            'date': '2024-01-15',
            'typeName': 'Meeting',
            'typeId': 'type-1',
            'hasExpense': false,
            'status': 'active',
            'createdAt': '2024-01-15T10:00:00Z',
          }
        ],
        'totals': {'count': 1, 'expenses': 0},
        'pagination': {'page': 1, 'limit': 20, 'total': 1, 'totalPages': 1},
      });

      expect(response.isEmpty, isFalse);
    });
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/user.dart';
import 'package:logger/models/user_role.dart';

void main() {
  group('AppUser', () {
    test('should create user with all fields', () {
      // Act
      final user = AppUser(
        id: 'user-123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: UserRole.missionary,
        association: 'Main Association',
        fields: ['field1', 'field2'],
      );

      // Assert
      expect(user.id, 'user-123');
      expect(user.name, 'John Doe');
      expect(user.email, 'john.doe@example.com');
      expect(user.role, UserRole.missionary);
      expect(user.association, 'Main Association');
      expect(user.fields, ['field1', 'field2']);
    });

    test('should create user with empty fields list', () {
      // Act
      final user = AppUser(
        id: 'user-456',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: UserRole.admin,
        association: 'Secondary Association',
        fields: [],
      );

      // Assert
      expect(user.fields, isEmpty);
    });

    test('should create user with different role', () {
      // Act
      final adminUser = AppUser(
        id: 'admin-789',
        name: 'Admin User',
        email: 'admin@example.com',
        role: UserRole.admin,
        association: 'Admin Association',
        fields: ['admin-field'],
      );

      final missionaryUser = AppUser(
        id: 'missionary-101',
        name: 'Missionary User',
        email: 'missionary@example.com',
        role: UserRole.missionary,
        association: 'Mission Association',
        fields: ['mission-field'],
      );

      // Assert
      expect(adminUser.role, UserRole.admin);
      expect(missionaryUser.role, UserRole.missionary);
      expect(adminUser.role, isNot(missionaryUser.role));
    });

    test('should maintain immutability', () {
      // Arrange
      final user = AppUser(
        id: 'user-999',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.missionary,
        association: 'Test Association',
        fields: ['field1'],
      );

      // Assert - All fields should be final (checked at compile time)
      expect(user.id, 'user-999');
      expect(user.name, 'Test User');
      expect(user.email, 'test@example.com');
    });
  });
}

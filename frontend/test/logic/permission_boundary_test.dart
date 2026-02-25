import 'package:flutter_test/flutter_test.dart';
import 'package:logger/providers/auth_state.dart';
import '../helpers/fake_auth_state.dart';

void main() {
  group('Permission boundaries', () {
    group('isLeadershipRole', () {
      test('platform admin (Presidente de Union) is a leadership role', () {
        expect(isLeadershipRole('Presidente de Unión'), isTrue);
      });

      test('association admin (Presidente de Asociacion) is a leadership role',
          () {
        expect(isLeadershipRole('Presidente de Asociación'), isTrue);
      });

      test('field director is a leadership role', () {
        expect(isLeadershipRole('Director de Campo'), isTrue);
      });

      test('union secretary is a leadership role', () {
        expect(isLeadershipRole('Secretario de Unión'), isTrue);
      });

      test('association secretary is a leadership role', () {
        expect(isLeadershipRole('Secretario de Asociación'), isTrue);
      });

      test('field secretary is a leadership role', () {
        expect(isLeadershipRole('Secretario de Campo'), isTrue);
      });

      test('system admin is a leadership role', () {
        expect(isLeadershipRole('Administrador del Sistema'), isTrue);
      });

      test('English role names also work', () {
        expect(isLeadershipRole('Union President'), isTrue);
        expect(isLeadershipRole('Association President'), isTrue);
        expect(isLeadershipRole('Field Director'), isTrue);
        expect(isLeadershipRole('System Admin'), isTrue);
      });

      test('field worker (Misionero) is NOT a leadership role', () {
        expect(isLeadershipRole('Misionero'), isFalse);
      });

      test('Anciano is NOT a leadership role', () {
        expect(isLeadershipRole('Anciano'), isFalse);
      });

      test('null role name returns false', () {
        expect(isLeadershipRole(null), isFalse);
      });

      test('empty string returns false', () {
        expect(isLeadershipRole(''), isFalse);
      });

      test('unknown role returns false', () {
        expect(isLeadershipRole('Random Role'), isFalse);
      });
    });

    group('getCurrencySymbol', () {
      test('returns entity currency from platform admin profile', () {
        final user = FakeAuthStates.platformAdmin().user;
        expect(getCurrencySymbol(user), equals('L.'));
      });

      test('returns entity currency from field worker profile', () {
        final user = FakeAuthStates.fieldWorker().user;
        expect(getCurrencySymbol(user), equals('L.'));
      });

      test('returns dollar sign when no currency in profile', () {
        final user = FakeAuthStates.userWithoutCurrency().user;
        expect(getCurrencySymbol(user), equals('\$'));
      });

      test('returns dollar sign for null user', () {
        expect(getCurrencySymbol(null), equals('\$'));
      });

      test('returns dollar sign for empty user map', () {
        expect(getCurrencySymbol({}), equals('\$'));
      });
    });

    group('Role-based report visibility logic', () {
      test(
          'platform admin should see entity reports (canViewReports equivalent)',
          () {
        final admin = FakeAuthStates.platformAdmin();
        final primaryRole =
            admin.user?['primary_role'] as Map<String, dynamic>?;
        final roleName = primaryRole?['name'] as String?;
        expect(isLeadershipRole(roleName), isTrue);
      });

      test(
          'association admin should see entity reports (canViewReports equivalent)',
          () {
        final assoc = FakeAuthStates.associationAdmin();
        final primaryRole =
            assoc.user?['primary_role'] as Map<String, dynamic>?;
        final roleName = primaryRole?['name'] as String?;
        expect(isLeadershipRole(roleName), isTrue);
      });

      test(
          'field worker should NOT see entity reports (canViewReports equivalent)',
          () {
        final field = FakeAuthStates.fieldWorker();
        final primaryRole =
            field.user?['primary_role'] as Map<String, dynamic>?;
        final roleName = primaryRole?['name'] as String?;
        expect(isLeadershipRole(roleName), isFalse);
      });
    });
  });
}

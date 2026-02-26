import 'package:flutter_test/flutter_test.dart';
import 'package:logger/models/activity.dart';
import 'package:logger/models/activity_type.dart';
import 'package:logger/core/validators.dart';

void main() {
  group('Activity form bugs', () {
    group('BUG-004: Null check error when saving without activity type', () {
      // activity_form_dialog.dart:158 does: _selectedType!.id
      // When no types are available for a role, _selectedType is null.
      // The form validator on the DropdownButtonFormField is NOT rendered
      // when types list is empty (line 406-408 shows a text message instead).
      // So form validation passes, _submit() is called, and _selectedType! crashes.
      //
      // Root cause trace:
      // 1. User selects a role (e.g., Presidente de Union)
      // 2. API returns empty types list for that role
      // 3. Dialog shows "No hay tipos de actividad disponibles." text
      // 4. DropdownButtonFormField is NOT rendered (no validator attached)
      // 5. User clicks "Guardar"
      // 6. _formKey.currentState!.validate() passes (no type validator)
      // 7. _submit() runs, hits _selectedType!.id -> null check error
      //
      // Fix options:
      // a) Disable "Guardar" button when _selectedType is null
      // b) Add null check in _submit() before accessing _selectedType

      test(
          'requiredField validator catches null ActivityType (but only when dropdown is rendered)',
          () {
        // The validator IS correct...
        expect(
          Validators.requiredField<ActivityType>(
            null,
            fieldName: 'El tipo de actividad',
          ),
          equals('El tipo de actividad es requerido'),
        );
        // ...but it's only attached to the DropdownButtonFormField
        // which is not rendered when types list is empty.
      });
    });

    group('BUG-005: No activity types for admin role', () {
      // When the admin role (Presidente de Union) has no activity types
      // configured in the backend, the form shows a message:
      // "No hay tipos de actividad disponibles." (line 407)
      //
      // This test documents that an empty types list is a valid API response
      // that the UI should handle gracefully (it does show a message, but
      // the submit button should be disabled).

      test('empty activity types list is a valid scenario', () {
        // The form handles this at the UI level by showing a message
        // but the submit flow doesn't guard against it
        const types = <ActivityType>[];
        expect(types.isEmpty, isTrue);
      });
    });

    group('Activity model parsing', () {
      test('fromApi parses complete activity', () {
        final activity = Activity.fromApi({
          'id': 'act-123',
          'activityDate': '2026-02-15T00:00:00.000Z',
          'activityTypeName': 'Visita Pastoral',
          'activityTypeId': 'type-001',
          'description': 'Test description',
          'expenseAmount': '150.50',
          'hasExpense': true,
          'locked': false,
          'reportingPeriodId': 'rp-001',
          'reportingPeriodName': 'Feb 2026',
          'status': 'active',
          'ownerUserId': 'user-001',
          'ownerUsername': 'obrero.campo1',
        });
        expect(activity.id, equals('act-123'));
        expect(activity.category, equals('Visita Pastoral'));
        expect(activity.expense, equals(150.50));
        expect(activity.hasExpense, isTrue);
        expect(activity.locked, isFalse);
        expect(activity.ownerUsername, equals('obrero.campo1'));
      });

      test('fromApi handles null expense amount', () {
        final activity = Activity.fromApi({
          'activityDate': '2026-02-15T00:00:00.000Z',
          'description': 'No expense',
        });
        expect(activity.expense, equals(0.0));
        expect(activity.hasExpense, isFalse);
      });

      test('fromApi uses default category when type name is missing', () {
        final activity = Activity.fromApi({
          'activityDate': '2026-02-15T00:00:00.000Z',
        });
        expect(activity.category, equals('Actividad'));
      });

      test('fromApi handles locked activities', () {
        final activity = Activity.fromApi({
          'activityDate': '2026-02-15T00:00:00.000Z',
          'locked': true,
          'status': 'active',
        });
        expect(activity.locked, isTrue);
      });
    });

    group('Validators', () {
      test('required rejects null and empty strings', () {
        expect(Validators.required(null), isNotNull);
        expect(Validators.required(''), isNotNull);
        expect(Validators.required('   '), isNotNull);
      });

      test('required accepts non-empty strings', () {
        expect(Validators.required('hello'), isNull);
      });

      test('positiveNumber rejects non-positive values', () {
        expect(Validators.positiveNumber('0'), isNotNull);
        expect(Validators.positiveNumber('-1'), isNotNull);
        expect(Validators.positiveNumber('abc'), isNotNull);
      });

      test('positiveNumber accepts positive values', () {
        expect(Validators.positiveNumber('1'), isNull);
        expect(Validators.positiveNumber('0.01'), isNull);
        expect(Validators.positiveNumber('99999'), isNull);
      });

      test('positiveNumber allows null/empty (optional field)', () {
        expect(Validators.positiveNumber(null), isNull);
        expect(Validators.positiveNumber(''), isNull);
      });

      test('combine returns first error found', () {
        final error = Validators.combine([
          () => null, // passes
          () => 'Error 1', // fails
          () => 'Error 2', // not reached
        ]);
        expect(error, equals('Error 1'));
      });

      test('combine returns null when all pass', () {
        final error = Validators.combine([
          () => null,
          () => null,
        ]);
        expect(error, isNull);
      });
    });
  });
}

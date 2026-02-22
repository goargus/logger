import 'package:flutter_test/flutter_test.dart';
import 'package:logger/core/validators.dart';

void main() {
  group('Validators.required', () {
    test('rejects null', () {
      expect(Validators.required(null), isNotNull);
    });

    test('rejects empty string', () {
      expect(Validators.required(''), isNotNull);
    });

    test('rejects whitespace-only string', () {
      expect(Validators.required('   '), isNotNull);
    });

    test('accepts non-empty string', () {
      expect(Validators.required('hello'), isNull);
    });

    test('uses custom field name in message', () {
      final error = Validators.required(null, fieldName: 'La fecha');
      expect(error, contains('La fecha'));
    });
  });

  group('Validators.requiredField', () {
    test('rejects null value', () {
      expect(Validators.requiredField<String>(null), isNotNull);
    });

    test('accepts non-null value', () {
      expect(Validators.requiredField<String>('value'), isNull);
    });

    test('accepts non-null object', () {
      expect(Validators.requiredField<int>(42), isNull);
    });

    test('uses custom field name in message', () {
      final error = Validators.requiredField<String>(
        null,
        fieldName: 'El tipo de actividad',
      );
      expect(error, contains('El tipo de actividad'));
    });
  });

  group('Validators.positiveNumber', () {
    test('accepts valid positive number', () {
      expect(Validators.positiveNumber('10'), isNull);
    });

    test('rejects zero', () {
      expect(Validators.positiveNumber('0'), isNotNull);
    });

    test('rejects negative number', () {
      expect(Validators.positiveNumber('-5'), isNotNull);
    });

    test('rejects non-numeric input', () {
      expect(Validators.positiveNumber('abc'), isNotNull);
    });

    test('allows null (optional field pattern)', () {
      expect(Validators.positiveNumber(null), isNull);
    });
  });

  group('Validators.dateNotInFuture', () {
    test('allows past date', () {
      final past = DateTime.now().subtract(const Duration(days: 1));
      expect(Validators.dateNotInFuture(past), isNull);
    });

    test('allows today', () {
      expect(Validators.dateNotInFuture(DateTime.now()), isNull);
    });

    test('rejects future date', () {
      final future = DateTime.now().add(const Duration(days: 1));
      expect(Validators.dateNotInFuture(future), isNotNull);
    });

    test('allows null (optional field pattern)', () {
      expect(Validators.dateNotInFuture(null), isNull);
    });
  });

  group('Validators.combine', () {
    test('returns null when all validators pass', () {
      final result = Validators.combine([
        () => null,
        () => null,
      ]);
      expect(result, isNull);
    });

    test('returns first error encountered', () {
      final result = Validators.combine([
        () => null,
        () => 'error one',
        () => 'error two',
      ]);
      expect(result, 'error one');
    });

    test('short-circuits on first failure', () {
      var secondCalled = false;
      Validators.combine([
        () => 'fail',
        () {
          secondCalled = true;
          return null;
        },
      ]);
      expect(secondCalled, isFalse);
    });
  });
}

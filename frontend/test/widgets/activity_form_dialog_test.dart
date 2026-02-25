@TestOn('chrome')
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:logger/providers/auth.dart';
import 'package:logger/widgets/dialogs/activity_form_dialog.dart';
import '../helpers/fake_auth_state.dart';

class FakeAuthNotifier extends AuthNotifier {
  final AuthState _desired;
  FakeAuthNotifier(this._desired) : super() {
    state = _desired;
  }

  @override
  Future<void> login() async {}
  @override
  Future<void> logout() async {}
  @override
  Future<String?> getAccessToken() async => _desired.accessToken;
}

Widget _buildFormDialogTest({
  required AuthState authState,
  Map<String, dynamic>? existingActivity,
}) {
  return ProviderScope(
    overrides: [
      authNotifierProvider.overrideWith((_) => FakeAuthNotifier(authState)),
    ],
    child: MaterialApp(
      home: Scaffold(
        body: Builder(
          builder: (context) => Center(
            child: ElevatedButton(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (_) => ActivityFormDialog(
                    baseUrl: 'http://localhost:3000',
                    getAccessToken: () async => 'fake-token',
                    existingActivity: existingActivity,
                  ),
                );
              },
              child: const Text('Open'),
            ),
          ),
        ),
      ),
    ),
  );
}

/// Open the dialog and pump just enough frames to render it.
Future<void> _openDialog(WidgetTester tester) async {
  await tester.tap(find.text('Open'));
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 100));
}

/// Expire the 30-second HTTP timeout timers from ApiClient.
/// All futures have FutureBuilder listeners, so errors are caught cleanly.
Future<void> _cleanupTimers(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 31));
  while (tester.takeException() != null) {}
  await tester.pump();
  while (tester.takeException() != null) {}
}

void main() {
  setUpAll(() async {
    await initializeDateFormatting('es');
  });

  group('ActivityFormDialog widget tests', () {
    void setupViewport(WidgetTester tester) {
      tester.view.physicalSize = const Size(1280, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
    }

    testWidgets(
        'BUG-004: submit button is disabled before selecting activity type',
        (tester) async {
      setupViewport(tester);

      await tester.pumpWidget(
          _buildFormDialogTest(authState: FakeAuthStates.fieldWorker()));
      await tester.pumpAndSettle();

      await _openDialog(tester);

      expect(find.text('Crear actividad'), findsOneWidget);

      final saveButton = find.text('Guardar');
      expect(saveButton, findsOneWidget);

      final filledButton = find.ancestor(
        of: saveButton,
        matching: find.byType(FilledButton),
      );
      expect(filledButton, findsOneWidget);

      final button = tester.widget<FilledButton>(filledButton);
      expect(button.onPressed, isNull,
          reason:
              'BUG-004: Submit should be disabled when no activity type is selected');

      await _cleanupTimers(tester);
    });

    testWidgets('shows role label and activity type label', (tester) async {
      setupViewport(tester);

      await tester.pumpWidget(
          _buildFormDialogTest(authState: FakeAuthStates.fieldWorker()));
      await tester.pumpAndSettle();

      await _openDialog(tester);

      expect(find.text('Rol'), findsOneWidget);
      expect(find.text('Tipo de actividad'), findsOneWidget);
      expect(find.text('Fecha'), findsOneWidget);

      await _cleanupTimers(tester);
    });

    testWidgets('shows cancel and submit buttons', (tester) async {
      setupViewport(tester);

      await tester.pumpWidget(
          _buildFormDialogTest(authState: FakeAuthStates.fieldWorker()));
      await tester.pumpAndSettle();

      await _openDialog(tester);

      expect(find.text('Cancelar'), findsOneWidget);
      expect(find.text('Guardar'), findsOneWidget);

      await _cleanupTimers(tester);
    });

    testWidgets('shows edit title when existingActivity provided',
        (tester) async {
      setupViewport(tester);

      await tester.pumpWidget(_buildFormDialogTest(
        authState: FakeAuthStates.fieldWorker(),
        existingActivity: {
          'id': 'act-001',
          'activityDate': '2026-02-15T00:00:00.000Z',
          'description': 'Test',
        },
      ));
      await tester.pumpAndSettle();

      await _openDialog(tester);

      expect(find.text('Editar actividad'), findsOneWidget);
      expect(find.text('Actualizar'), findsOneWidget);

      await _cleanupTimers(tester);
    });
  });
}

@TestOn('chrome')
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logger/providers/auth.dart';
import 'package:logger/providers/auth_state.dart';
import 'package:logger/pages/reports_page.dart';
import '../helpers/fake_auth_state.dart';

class FakeAuthNotifier extends AuthNotifier {
  final AuthState _desired;

  FakeAuthNotifier(this._desired) : super() {
    state = _desired;
  }

  @override
  Future<void> login() async {}

  @override
  Future<void> logout() async {
    state = const AuthState(isLoading: false, isAuthenticated: false);
  }

  @override
  Future<String?> getAccessToken() async => _desired.accessToken;
}

Widget _buildReportsTest({required AuthState authState}) {
  return ProviderScope(
    overrides: [
      authNotifierProvider.overrideWith((_) => FakeAuthNotifier(authState)),
    ],
    child: const MaterialApp(
      home: Scaffold(body: ReportsPage()),
    ),
  );
}

void main() {
  group('ReportsPage widget tests', () {
    group('Tab visibility based on role', () {
      testWidgets('field worker sees NO tabs (direct report view)',
          (tester) async {
        await tester
            .pumpWidget(_buildReportsTest(authState: FakeAuthStates.fieldWorker()));
        await tester.pumpAndSettle();

        // Field worker (Misionero) is NOT a leadership role
        // ReportsPage shows ReportsViewContent directly without tabs
        expect(find.text('Mi Reporte'), findsNothing);
        expect(find.text('Entidad'), findsNothing);
      });

      testWidgets('platform admin sees Mi Reporte and Entidad tabs',
          (tester) async {
        await tester.pumpWidget(
            _buildReportsTest(authState: FakeAuthStates.platformAdmin()));
        await tester.pumpAndSettle();

        // Admin (Presidente de Union) IS a leadership role
        // ReportsPage shows DefaultTabController with 2 tabs
        expect(find.text('Mi Reporte'), findsOneWidget);
        expect(find.text('Entidad'), findsOneWidget);
      });

      testWidgets('association admin sees both tabs', (tester) async {
        await tester.pumpWidget(
            _buildReportsTest(authState: FakeAuthStates.associationAdmin()));
        await tester.pumpAndSettle();

        expect(find.text('Mi Reporte'), findsOneWidget);
        expect(find.text('Entidad'), findsOneWidget);
      });
    });
  });
}

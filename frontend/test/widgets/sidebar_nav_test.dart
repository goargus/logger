@TestOn('chrome')
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logger/providers/auth.dart';
import 'package:logger/widgets/nav/sidebar_nav.dart';
import '../helpers/fake_auth_state.dart';

/// Fake AuthNotifier that sets a fixed state without triggering Auth0 bootstrap.
/// Works because AuthConfig.isConfigured is false in tests (no --dart-define),
/// so _bootstrap() returns early.
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

Widget _buildSidebarTest({
  required AuthState authState,
  String currentPath = '/',
}) {
  final userName = authState.user?['first_name'] ?? 'User';
  final userEmail = authState.user?['email'] ?? '';

  return ProviderScope(
    overrides: [
      authNotifierProvider.overrideWith((_) => FakeAuthNotifier(authState)),
    ],
    child: MaterialApp(
      home: Scaffold(
        body: SizedBox(
          width: 280,
          child: SidebarNav(
            userName: userName,
            userEmail: userEmail,
            currentPath: currentPath,
          ),
        ),
      ),
    ),
  );
}

void main() {
  group('SidebarNav widget tests', () {
    group('BUG-009: Logout mechanism (widget-level proof)', () {
      testWidgets('PopupMenuButton exists in user profile area',
          (tester) async {
        await tester.pumpWidget(
            _buildSidebarTest(authState: FakeAuthStates.fieldWorker()));
        await tester.pumpAndSettle();

        expect(find.byType(PopupMenuButton<String>), findsOneWidget);
      });

      testWidgets('tapping profile opens popup with "Cerrar sesion"',
          (tester) async {
        await tester.pumpWidget(
            _buildSidebarTest(authState: FakeAuthStates.fieldWorker()));
        await tester.pumpAndSettle();

        await tester.tap(find.byType(PopupMenuButton<String>));
        await tester.pumpAndSettle();

        expect(find.text('Cerrar sesión'), findsOneWidget);
        expect(find.byIcon(Icons.logout), findsOneWidget);
      });
    });

    group('BUG-011: Navigation label matches entity type', () {
      testWidgets('field worker sees "Campo"', (tester) async {
        await tester.pumpWidget(
            _buildSidebarTest(authState: FakeAuthStates.fieldWorker()));
        await tester.pumpAndSettle();

        expect(find.text('Campo'), findsOneWidget);
        expect(find.text('Platform Navigation'), findsNothing);
      });

      testWidgets('platform admin sees "Unión"', (tester) async {
        await tester.pumpWidget(
            _buildSidebarTest(authState: FakeAuthStates.platformAdmin()));
        await tester.pumpAndSettle();

        expect(find.text('Unión'), findsOneWidget);
      });

      testWidgets('association admin sees "Asociación"', (tester) async {
        await tester.pumpWidget(
            _buildSidebarTest(authState: FakeAuthStates.associationAdmin()));
        await tester.pumpAndSettle();

        expect(find.text('Asociación'), findsOneWidget);
      });
    });

    group('Navigation items', () {
      testWidgets('renders Dashboard, Actividades, Reportes', (tester) async {
        await tester.pumpWidget(
            _buildSidebarTest(authState: FakeAuthStates.fieldWorker()));
        await tester.pumpAndSettle();

        expect(find.text('Dashboard'), findsOneWidget);
        expect(find.text('Actividades'), findsOneWidget);
        expect(find.text('Reportes'), findsOneWidget);
      });

      testWidgets('shows user name and email', (tester) async {
        await tester.pumpWidget(
            _buildSidebarTest(authState: FakeAuthStates.platformAdmin()));
        await tester.pumpAndSettle();

        expect(find.text('Daniel'), findsOneWidget);
        expect(find.text('daniel.contreras@uhn.test'), findsOneWidget);
      });
    });
  });
}

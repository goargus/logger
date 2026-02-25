import 'package:flutter_test/flutter_test.dart';
import 'package:logger/providers/auth_state.dart';
import 'fake_auth_state.dart';
import 'fake_data.dart';

void main() {
  test('FakeAuthStates compile and have correct structure', () {
    final admin = FakeAuthStates.platformAdmin();
    expect(admin.isAuthenticated, isTrue);
    expect(admin.user?['primary_role']['name'], 'Presidente de Unión');

    final field = FakeAuthStates.fieldWorker();
    expect(field.isAuthenticated, isTrue);
    expect(field.user?['primary_role']['name'], 'Misionero');

    final assoc = FakeAuthStates.associationAdmin();
    expect(assoc.isAuthenticated, isTrue);
    expect(assoc.user?['primary_role']['name'], 'Presidente de Asociación');
  });

  test('FakeData compiles and has correct structure', () {
    final stats = FakeData.dashboardStats();
    expect(stats.visits, 5);
    expect(stats.totalActivities, 8);

    final activities = FakeData.recentActivities();
    expect(activities.length, 2);
    expect(activities[0].category, 'Visita Pastoral');
  });

  test('AuthState default constructor works without required params', () {
    const state = AuthState();
    expect(state.isLoading, isFalse);
    expect(state.isAuthenticated, isFalse);
    expect(state.user, isNull);
  });
}

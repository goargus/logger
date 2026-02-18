import 'package:logger/providers/auth_state.dart';

/// Pre-built auth states for testing different user roles.
/// Based on actual test users from pre-production validation.
class FakeAuthStates {
  /// Platform admin - Presidente de Union (daniel.contreras@uhn.test)
  static AuthState platformAdmin() => const AuthState(
        isLoading: false,
        isAuthenticated: true,
        user: {
          'id': 'user-admin-001',
          'email': 'daniel.contreras@uhn.test',
          'username': 'daniel.contreras',
          'first_name': 'Daniel',
          'family_name': 'Contreras',
          'full_name': 'Daniel Contreras',
          'primary_role': {
            'id': 'role-001',
            'name': 'Presidente de Unión',
            'description': 'Union President',
          },
          'primary_entity': {
            'id': 'entity-001',
            'name': 'Unión Hondureña',
            'description': 'Honduras Union',
            'type': 'UNION',
            'currency_symbol': 'L.',
          },
          'currency_symbol': 'L.',
        },
        accessToken: 'fake-token-admin',
      );

  /// Association admin (admin.asoc.noroccidental@uhn.test)
  static AuthState associationAdmin() => const AuthState(
        isLoading: false,
        isAuthenticated: true,
        user: {
          'id': 'user-assoc-001',
          'email': 'admin.asoc.noroccidental@uhn.test',
          'username': 'admin.asoc.noroccidental',
          'first_name': 'Admin',
          'family_name': 'Noroccidental',
          'full_name': 'Admin Noroccidental',
          'primary_role': {
            'id': 'role-002',
            'name': 'Presidente de Asociación',
            'description': 'Association President',
          },
          'primary_entity': {
            'id': 'entity-002',
            'name': 'Asoc. Nor-occidental',
            'description': 'Northwestern Association',
            'type': 'ASSOCIATION',
            'currency_symbol': 'L.',
          },
          'currency_symbol': 'L.',
        },
        accessToken: 'fake-token-assoc',
      );

  /// Field worker (obrero.campo1@uhn.test)
  static AuthState fieldWorker() => const AuthState(
        isLoading: false,
        isAuthenticated: true,
        user: {
          'id': 'user-field-001',
          'email': 'obrero.campo1@uhn.test',
          'username': 'obrero.campo1',
          'first_name': 'Obrero',
          'family_name': 'Campo',
          'full_name': 'Obrero Campo',
          'primary_role': {
            'id': 'role-003',
            'name': 'Misionero',
            'description': 'Missionary',
          },
          'primary_entity': {
            'id': 'entity-003',
            'name': 'Campo Copán',
            'description': 'Copan Field',
            'type': 'FIELD',
            'currency_symbol': 'L.',
          },
          'currency_symbol': 'L.',
        },
        accessToken: 'fake-token-field',
      );

  /// User with no currency symbol in profile
  static AuthState userWithoutCurrency() => const AuthState(
        isLoading: false,
        isAuthenticated: true,
        user: {
          'id': 'user-no-currency',
          'primary_role': {'name': 'Misionero'},
        },
        accessToken: 'fake-token',
      );
}

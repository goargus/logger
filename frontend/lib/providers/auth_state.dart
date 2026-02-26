import 'package:flutter/foundation.dart';

@immutable
class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final Map<String, dynamic>? user;
  final String? accessToken;
  final String? lastError;

  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.accessToken,
    this.lastError,
  });

  factory AuthState.initial() =>
      const AuthState(isLoading: true, isAuthenticated: false);

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    Map<String, dynamic>? user,
    String? accessToken,
    String? lastError,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      accessToken: accessToken ?? this.accessToken,
      lastError: lastError,
    );
  }
}

/// Leadership roles that grant access to entity-level reports.
const leadershipRoles = [
  'admin',
  'System Admin',
  'Administrador del Sistema',
  'president',
  'Union President',
  'Presidente de Unión',
  'Association President',
  'Presidente de Asociación',
  'Field Director',
  'Director de Campo',
  'Union Secretary',
  'Secretario de Unión',
  'Association Secretary',
  'Secretario de Asociación',
  'Field Secretary',
  'Secretario de Campo',
];

/// Returns true if the given role name is a leadership role
/// that can view entity-level reports.
bool isLeadershipRole(String? roleName) {
  return roleName != null && leadershipRoles.contains(roleName);
}

/// Extracts the currency symbol from the user profile map.
/// Returns '$' as default if not available.
String getCurrencySymbol(Map<String, dynamic>? user) {
  final currencySymbol = user?['currency_symbol'] as String?;
  return currencySymbol ?? '\$';
}

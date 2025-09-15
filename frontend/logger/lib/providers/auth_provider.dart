import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:auth0_flutter/auth0_flutter.dart';

class AuthState {
  final bool isAuthenticated;
  final Credentials? credentials;
  final String? error;
  final bool isLoading;

  const AuthState({
    this.isAuthenticated = false,
    this.credentials,
    this.error,
    this.isLoading = false,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    Credentials? credentials,
    String? error,
    bool? isLoading,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      credentials: credentials ?? this.credentials,
      error: error,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  // TODO: Initialize Auth0 and implement authentication methods
  // This will be implemented in the next phase
  
  void setAuthenticated(Credentials credentials) {
    state = state.copyWith(
      isAuthenticated: true,
      credentials: credentials,
      error: null,
    );
  }

  void setUnauthenticated() {
    state = state.copyWith(
      isAuthenticated: false,
      credentials: null,
      error: null,
    );
  }

  void setError(String error) {
    state = state.copyWith(
      error: error,
      isLoading: false,
    );
  }

  void setLoading(bool loading) {
    state = state.copyWith(isLoading: loading);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
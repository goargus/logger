import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:auth0_flutter/auth0_flutter.dart';
import 'package:auth0_flutter/auth0_flutter_web.dart';
import '../config/auth_config.dart';

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
  late final Auth0Web _auth0;

  AuthNotifier() : super(const AuthState()) {
    _initializeAuth0();
  }

  void _initializeAuth0() {
    _auth0 = Auth0Web(AuthConfig.domain, AuthConfig.clientId);
    _checkExistingSession();
  }

  Future<void> _checkExistingSession() async {
    try {
      setLoading(true);
      final credentials = await _auth0.onLoad();
      if (credentials != null) {
        setAuthenticated(credentials);
      }
    } catch (e) {
      setError('Error loading existing session: $e');
    } finally {
      setLoading(false);
    }
  }

  Future<void> login() async {
    try {
      setLoading(true);
      await _auth0.loginWithRedirect(redirectUrl: AuthConfig.redirectUri);
    } catch (e) {
      setError('Login failed: $e');
    }
  }

  Future<void> logout() async {
    try {
      setLoading(true);
      await _auth0.logout();
      setUnauthenticated();
    } catch (e) {
      setError('Logout failed: $e');
    } finally {
      setLoading(false);
    }
  }

  void setAuthenticated(Credentials credentials) {
    state = state.copyWith(
      isAuthenticated: true,
      credentials: credentials,
      error: null,
      isLoading: false,
    );
  }

  void setUnauthenticated() {
    state = state.copyWith(
      isAuthenticated: false,
      credentials: null,
      error: null,
      isLoading: false,
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
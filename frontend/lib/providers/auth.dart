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

  Future<void> _initializeAuth0() async {
    try {
      if (!AuthConfig.isConfigured) {
        setError(
            'Auth0 configuration missing. Please set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_REDIRECT_URI, and AUTH0_AUDIENCE environment variables.');
        return;
      }

      _auth0 = Auth0Web(AuthConfig.domain, AuthConfig.clientId);

      // Replicate original simple approach
      _auth0.onLoad().then((creds) {
        if (creds != null) {
          setAuthenticated(creds);
        } else {
          setLoading(false);
        }
      }).catchError((e) {
        setError('Auth0 session load failed: $e');
      });
    } catch (e) {
      setError('Auth0 initialization failed: $e');
    }
  }

  Future<void> login() async {
    try {
      setLoading(true);
      final audience =
          AuthConfig.audience.isNotEmpty ? AuthConfig.audience : 'logger';

      await _auth0.loginWithRedirect(
        redirectUrl: AuthConfig.redirectUri,
        audience: audience,
        scopes: {
          'openid',
          'profile',
          'email',
          'read:activities',
          'write:activities'
        },
      );
    } catch (e) {
      setError('Login failed: $e');
    }
  }

  Future<void> logout() async {
    try {
      setLoading(true);
      await _auth0.logout(returnToUrl: AuthConfig.redirectUri);
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

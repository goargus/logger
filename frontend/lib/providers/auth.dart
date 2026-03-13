import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:web/web.dart' as web;

import '../config/auth_config.dart';
import '../services/user.dart';

import '../auth/session.dart';
import '../auth/session_interface.dart';

import '../utils/url_utils.dart';
import 'auth_state.dart';
export 'auth_state.dart';

enum IdpType { entra, auth0 }

const bool kAutoRedirectOnBoot = false;

final authNotifierProvider =
    NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

class AuthNotifier extends Notifier<AuthState> {
  final SessionInterface _session = Session();

  bool _bootstrapped = false;
  bool _isRedirecting = false;

  String _friendlyAuthError(Object error) {
    final message = error.toString().toLowerCase();

    if (message.contains('pkce') ||
        message.contains('authorization code') ||
        message.contains('authentication flow') ||
        message.contains('no token found')) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    }

    if (message.contains('exchange code') ||
        message.contains('failed to exchange') ||
        message.contains('oauth/token')) {
      return 'No pudimos iniciar sesión. Por favor, inténtalo de nuevo.';
    }

    if (message.contains('not configured') ||
        message.contains('dart-define')) {
      return 'La autenticación no está disponible en este momento.';
    }

    return 'Ocurrió un problema al iniciar sesión. Por favor, inténtalo de nuevo.';
  }

  String _authError(Object error) {
    debugPrint('[AuthNotifier] Auth error: $error');
    return _friendlyAuthError(error);
  }

  @override
  AuthState build() {
    _bootstrapped = false;
    _isRedirecting = false;
    _bootstrap();
    return AuthState.initial();
  }

  String _generateCodeVerifier() {
    const charset =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    final random = Random.secure();
    const length = 128;
    return List.generate(length, (_) => charset[random.nextInt(charset.length)])
        .join();
  }

  String _generateCodeChallenge(String verifier) {
    final bytes = utf8.encode(verifier);
    final digest = sha256.convert(bytes);
    return base64Url.encode(digest.bytes).replaceAll('=', '');
  }

  Map<String, dynamic> _parseIdToken(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return {};
      final normalized = base64Url.normalize(parts[1]);
      final decoded = utf8.decode(base64Url.decode(normalized));
      return jsonDecode(decoded) as Map<String, dynamic>;
    } catch (e) {
      debugPrint('[AuthNotifier] Failed to parse token: $e');
      return {};
    }
  }

  IdpType? _getSavedIdpType() {
    final saved = web.window.localStorage.getItem('idp_type');
    if (saved == 'entra') return IdpType.entra;
    if (saved == 'auth0') return IdpType.auth0;
    return null;
  }

  void _saveIdpType(IdpType type) {
    web.window.localStorage.setItem('idp_type', type == IdpType.entra ? 'entra' : 'auth0');
  }

  String _generateState() {
    final bytes = List<int>.generate(32, (_) => Random.secure().nextInt(256));
    return base64Url.encode(bytes).replaceAll('=', '');
  }

  Future<void> _bootstrap() async {
    if (_bootstrapped) return;
    _bootstrapped = true;

    if (!AuthConfig.isConfigured) {
      state = state.copyWith(
        isLoading: false,
        lastError: _friendlyAuthError(
            'La autenticacion no esta configurada. Contacte al administrador.'),
      );
      return;
    }

    try {
      final existingToken = web.window.localStorage.getItem('auth_token');
      final uri = Uri.parse(web.window.location.href);
      final hasAuthCode = uri.queryParameters.containsKey('code') &&
          uri.queryParameters.containsKey('state');

      if (hasAuthCode) {
        if (existingToken != null && existingToken.isNotEmpty) {
          _clearAuthCallbackParams(uri);
          await _refreshSession();
          return;
        }

        await _handleAuthCallback();
        return;
      }

      if (existingToken != null && existingToken.isNotEmpty) {
        await _refreshSession();
        return;
      }

      if (kAutoRedirectOnBoot && !_isRedirecting) {
        await login();
      } else {
        await Future<void>.delayed(Duration.zero);
        state = state.copyWith(isLoading: false, isAuthenticated: false);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        lastError: _authError(e),
      );
    }
  }

  Future<Map<String, dynamic>> _fetchBackendUserProfile(
      String accessToken) async {
    try {
      final userService = UserService.localhost(() async => accessToken);
      final profile = await userService.getMyProfile();

      final result = <String, dynamic>{
        'id': profile.id,
        'email': profile.email,
        'username': profile.username,
        'status': profile.status,
      };

      if (profile.firstName != null) result['first_name'] = profile.firstName;
      if (profile.familyName != null) {
        result['family_name'] = profile.familyName;
      }
      if (profile.fullName != null) result['full_name'] = profile.fullName;

      result['primary_role'] = {
        'id': profile.primaryRole.id,
        'name': profile.primaryRole.name,
        'description': profile.primaryRole.description,
      };

      result['primary_entity'] = {
        'id': profile.primaryEntity.id,
        'name': profile.primaryEntity.name,
        'description': profile.primaryEntity.description,
        'type': profile.primaryEntity.type,
        'currency_symbol': profile.primaryEntity.currencySymbol,
      };

      result['currency_symbol'] = profile.currencySymbol;

      return result;
    } catch (e) {
      return {};
    }
  }

  Future<void> _handleAuthCallback() async {
    try {
      final uri = Uri.parse(web.window.location.href);
      final code = uri.queryParameters['code'];
      final returnedState = uri.queryParameters['state'];

      if (code == null || code.isEmpty) {
        throw Exception('No authorization code found in callback URL');
      }

      // Validate CSRF state parameter
      final savedState = web.window.localStorage.getItem('oauth_state');
      if (savedState == null || savedState != returnedState) {
        web.window.localStorage.removeItem('oauth_state');
        throw Exception('Invalid state parameter');
      }
      web.window.localStorage.removeItem('oauth_state');

      final codeVerifier =
          web.window.localStorage.getItem('pkce_code_verifier');
      if (codeVerifier == null || codeVerifier.isEmpty) {
        throw Exception('Missing PKCE verifier');
      }

      final idpType = _getSavedIdpType() ?? IdpType.auth0;

      String tokenUrl;
      Map<String, String> tokenBody;

      if (idpType == IdpType.entra) {
        tokenUrl = AuthConfig.entraTokenUrl;
        tokenBody = {
          'grant_type': 'authorization_code',
          'client_id': AuthConfig.entraClientId,
          'code': code,
          'redirect_uri': AuthConfig.redirectUri,
          'code_verifier': codeVerifier,
          'scope': 'openid profile email ${AuthConfig.entraApiScope}',
        };
      } else {
        tokenUrl = 'https://${AuthConfig.auth0Domain}/oauth/token';
        tokenBody = {
          'grant_type': 'authorization_code',
          'client_id': AuthConfig.auth0ClientId,
          'code': code,
          'redirect_uri': AuthConfig.redirectUri,
          'code_verifier': codeVerifier,
        };
      }

      final tokenResponse = await http.post(
        Uri.parse(tokenUrl),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: tokenBody,
      );

      if (tokenResponse.statusCode != 200) {
        throw Exception('Failed to exchange code for token: ${tokenResponse.statusCode}');
      }

      final tokens = jsonDecode(tokenResponse.body);
      final accessToken = tokens['access_token'] as String;

      // Get user info
      Map<String, dynamic> userInfo = {};
      if (idpType == IdpType.entra) {
        // Parse ID token directly (Entra ID includes claims)
        final idToken = tokens['id_token'] as String?;
        if (idToken != null) {
          userInfo = _parseIdToken(idToken);
        }
      } else {
        // Auth0: fetch from /userinfo endpoint
        final userResponse = await http.get(
          Uri.parse('https://${AuthConfig.auth0Domain}/userinfo'),
          headers: {'Authorization': 'Bearer $accessToken'},
        );
        if (userResponse.statusCode == 200) {
          userInfo = jsonDecode(userResponse.body) as Map<String, dynamic>;
        }
      }

      final backendProfile = await _fetchBackendUserProfile(accessToken);
      final mergedUserInfo = {...userInfo, ...backendProfile};

      web.window.localStorage.setItem('auth_token', accessToken);
      web.window.localStorage.removeItem('pkce_code_verifier');
      await _session.saveToken(accessToken);

      _clearAuthCallbackParams(uri);

      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: mergedUserInfo,
        accessToken: accessToken,
        lastError: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        lastError: _authError(e),
      );
    }
  }

  void _clearAuthCallbackParams(Uri uri) {
    web.window.history.replaceState(null, '', stripAuthCallbackParams(uri));
  }

  Future<void> _refreshSession() async {
    try {
      final accessToken = web.window.localStorage.getItem('auth_token');
      if (accessToken == null) {
        throw Exception('No token found');
      }

      final idpType = _getSavedIdpType();

      // Validate token by calling backend profile
      final backendProfile = await _fetchBackendUserProfile(accessToken);

      if (backendProfile.isEmpty) {
        web.window.localStorage.removeItem('auth_token');
        await _session.clear();
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          accessToken: null,
          user: null,
        );
        return;
      }

      // Get basic user info
      Map<String, dynamic> tokenInfo = {};
      if (idpType == IdpType.auth0) {
        // Auth0: try /userinfo endpoint
        try {
          final userResponse = await http.get(
            Uri.parse('https://${AuthConfig.auth0Domain}/userinfo'),
            headers: {'Authorization': 'Bearer $accessToken'},
          );
          if (userResponse.statusCode == 200) {
            tokenInfo = jsonDecode(userResponse.body) as Map<String, dynamic>;
          }
        } catch (_) {}
      } else {
        // Entra ID: parse claims from the access token JWT
        try {
          tokenInfo = _parseIdToken(accessToken);
        } catch (_) {}
      }

      final mergedUserInfo = {...tokenInfo, ...backendProfile};
      await _session.saveToken(accessToken);

      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: mergedUserInfo,
        accessToken: accessToken,
        lastError: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        lastError: _authError(e),
      );
    }
  }

  Future<void> loginWithEntra() async {
    if (_isRedirecting) return;
    _isRedirecting = true;

    try {
      final codeVerifier = _generateCodeVerifier();
      final codeChallenge = _generateCodeChallenge(codeVerifier);
      final stateValue = _generateState();

      web.window.localStorage.setItem('pkce_code_verifier', codeVerifier);
      web.window.localStorage.setItem('oauth_state', stateValue);
      _saveIdpType(IdpType.entra);

      final authUrl = Uri.parse(AuthConfig.entraAuthorizeUrl).replace(
        queryParameters: {
          'response_type': 'code',
          'client_id': AuthConfig.entraClientId,
          'redirect_uri': AuthConfig.redirectUri,
          'scope': 'openid profile email ${AuthConfig.entraApiScope}',
          'state': stateValue,
          'code_challenge': codeChallenge,
          'code_challenge_method': 'S256',
        },
      );

      web.window.location.assign(authUrl.toString());
    } catch (e) {
      _isRedirecting = false;
      state = state.copyWith(lastError: _authError(e));
    }
  }

  Future<void> loginWithAuth0() async {
    if (_isRedirecting) return;
    _isRedirecting = true;

    try {
      final codeVerifier = _generateCodeVerifier();
      final codeChallenge = _generateCodeChallenge(codeVerifier);
      final stateValue = _generateState();

      web.window.localStorage.setItem('pkce_code_verifier', codeVerifier);
      web.window.localStorage.setItem('oauth_state', stateValue);
      _saveIdpType(IdpType.auth0);

      final authUrl = Uri.https(AuthConfig.auth0Domain, '/authorize', {
        'response_type': 'code',
        'client_id': AuthConfig.auth0ClientId,
        'redirect_uri': AuthConfig.redirectUri,
        'scope': 'openid profile email',
        'audience': AuthConfig.auth0Audience,
        'state': stateValue,
        'code_challenge': codeChallenge,
        'code_challenge_method': 'S256',
      });

      web.window.location.assign(authUrl.toString());
    } catch (e) {
      _isRedirecting = false;
      state = state.copyWith(lastError: _authError(e));
    }
  }

  // Default login — prefers Entra if configured
  Future<void> login() async {
    if (AuthConfig.isEntraConfigured) {
      await loginWithEntra();
    } else if (AuthConfig.isAuth0Configured) {
      await loginWithAuth0();
    }
  }

  Future<String?> getAccessToken() async {
    try {
      final accessToken = web.window.localStorage.getItem('auth_token');
      if (accessToken == null) {
        return null;
      }

      try {
        await _session.saveToken(accessToken);
      } catch (_) {}

      state = state.copyWith(accessToken: accessToken);
      return accessToken;
    } catch (e) {
      state = state.copyWith(lastError: _authError(e));
      return null;
    }
  }

  Future<void> logout() async {
    try {
      final idpType = _getSavedIdpType();

      web.window.localStorage.removeItem('auth_token');
      web.window.localStorage.removeItem('pkce_code_verifier');
      web.window.localStorage.removeItem('oauth_state');
      web.window.localStorage.removeItem('idp_type');

      await _session.clear();

      state = AuthState.initial().copyWith(isLoading: true);

      var returnUrl = AuthConfig.redirectUri.replaceAll(RegExp(r'/$'), '');

      String logoutUrl;
      if (idpType == IdpType.entra) {
        logoutUrl = Uri.parse(AuthConfig.entraLogoutUrl).replace(
          queryParameters: {
            'client_id': AuthConfig.entraClientId,
            'post_logout_redirect_uri': returnUrl,
          },
        ).toString();
      } else {
        logoutUrl = Uri.https(AuthConfig.auth0Domain, '/v2/logout', {
          'client_id': AuthConfig.auth0ClientId,
          'returnTo': returnUrl,
        }).toString();
      }

      await Future.delayed(const Duration(milliseconds: 100));
      web.window.location.assign(logoutUrl);
    } catch (e) {
      debugPrint('[AuthNotifier] Error during logout: $e');
      try {
        web.window.localStorage.removeItem('auth_token');
        web.window.localStorage.removeItem('pkce_code_verifier');
        web.window.localStorage.removeItem('oauth_state');
        web.window.localStorage.removeItem('idp_type');
        await _session.clear();
      } catch (_) {}
      state = AuthState.initial();
      web.window.location.reload();
    }
  }
}

final canViewReportsProvider = Provider<bool>((ref) {
  final authState = ref.watch(authNotifierProvider);
  final primaryRole = authState.user?['primary_role'] as Map<String, dynamic>?;
  final roleName = primaryRole?['name'] as String?;
  return isLeadershipRole(roleName);
});

/// Provider for the user's effective currency symbol.
/// Returns the currency symbol from the user's profile (resolved from their Union).
/// Defaults to '$' if not available.
final currencySymbolProvider = Provider<String>((ref) {
  final authState = ref.watch(authNotifierProvider);
  return getCurrencySymbol(authState.user);
});

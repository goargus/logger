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

import 'auth_state.dart';
export 'auth_state.dart';

const bool kAutoRedirectOnBoot = true;

final authNotifierProvider =
    NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

class AuthNotifier extends Notifier<AuthState> {
  final SessionInterface _session = Session();

  bool _bootstrapped = false;
  bool _isRedirecting = false;

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

  Future<void> _bootstrap() async {
    if (_bootstrapped) return;
    _bootstrapped = true;

    if (!AuthConfig.isConfigured) {
      state = state.copyWith(
        isLoading: false,
        lastError:
            'Auth0 no está configurado. Revisa tus --dart-define en auth_config.dart',
      );
      return;
    }

    try {
      final currentUrl = web.window.location.href;
      if (currentUrl.contains('code=') && currentUrl.contains('state=')) {
        await _handleAuthCallback();
        return;
      }

      final existingToken = web.window.localStorage.getItem('auth_token');
      if (existingToken != null && existingToken.isNotEmpty) {
        await _refreshSession();
        return;
      }

      if (kAutoRedirectOnBoot && !_isRedirecting) {
        await login();
      } else {
        state = state.copyWith(isLoading: false, isAuthenticated: false);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        lastError: e.toString(),
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

      if (code == null || code.isEmpty) {
        throw Exception('No authorization code found in callback URL');
      }

      final codeVerifier =
          web.window.localStorage.getItem('pkce_code_verifier');
      if (codeVerifier == null || codeVerifier.isEmpty) {
        throw Exception(
            'Missing PKCE verifier. Authentication flow may have been interrupted.');
      }

      debugPrint(
          '[AuthNotifier] Exchanging authorization code with PKCE verifier...');

      final tokenResponse = await http.post(
        Uri.parse('https://${AuthConfig.domain}/oauth/token'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'grant_type': 'authorization_code',
          'client_id': AuthConfig.clientId,
          'code': code,
          'redirect_uri': AuthConfig.redirectUri,
          'code_verifier': codeVerifier,
        }),
      );

      if (tokenResponse.statusCode == 200) {
        final tokens = jsonDecode(tokenResponse.body);
        final accessToken = tokens['access_token'];

        final userResponse = await http.get(
          Uri.parse('https://${AuthConfig.domain}/userinfo'),
          headers: {'Authorization': 'Bearer $accessToken'},
        );

        if (userResponse.statusCode == 200) {
          final userInfo =
              jsonDecode(userResponse.body) as Map<String, dynamic>;

          final backendProfile = await _fetchBackendUserProfile(accessToken);

          final mergedUserInfo = {...userInfo, ...backendProfile};

          web.window.localStorage.setItem('auth_token', accessToken);
          web.window.localStorage.removeItem('pkce_code_verifier');
          await _session.saveToken(accessToken);

          web.window.history.replaceState(null, '', AuthConfig.redirectUri);

          state = state.copyWith(
            isLoading: false,
            isAuthenticated: true,
            user: mergedUserInfo,
            accessToken: accessToken,
            lastError: null,
          );
        }
      } else {
        throw Exception('Failed to exchange code for token');
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        lastError: e.toString(),
      );
    }
  }

  Future<void> _refreshSession() async {
    try {
      final accessToken = web.window.localStorage.getItem('auth_token');
      if (accessToken == null) {
        throw Exception('No token found');
      }

      final userResponse = await http.get(
        Uri.parse('https://${AuthConfig.domain}/userinfo'),
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      if (userResponse.statusCode == 200) {
        final userInfo = jsonDecode(userResponse.body) as Map<String, dynamic>;

        final backendProfile = await _fetchBackendUserProfile(accessToken);

        final mergedUserInfo = {...userInfo, ...backendProfile};

        await _session.saveToken(accessToken);

        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: mergedUserInfo,
          accessToken: accessToken,
          lastError: null,
        );
      } else {
        web.window.localStorage.removeItem('auth_token');
        await _session.clear();
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: false,
          accessToken: null,
          user: null,
        );
        if (!_isRedirecting) {
          await login();
        }
        return;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        lastError: e.toString(),
      );
    }
  }

  Future<void> login() async {
    if (_isRedirecting) return;
    _isRedirecting = true;

    try {
      final codeVerifier = _generateCodeVerifier();
      final codeChallenge = _generateCodeChallenge(codeVerifier);

      web.window.localStorage.setItem('pkce_code_verifier', codeVerifier);

      debugPrint(
          '[AuthNotifier] Generated PKCE challenge, initiating Auth0 redirect...');

      final authUrl = Uri.https(AuthConfig.domain, '/authorize', {
        'response_type': 'code',
        'client_id': AuthConfig.clientId,
        'redirect_uri': AuthConfig.redirectUri,
        'scope': 'openid profile email',
        'audience': AuthConfig.audience,
        'state': DateTime.now().millisecondsSinceEpoch.toString(),
        'code_challenge': codeChallenge,
        'code_challenge_method': 'S256',
      });

      web.window.location.assign(authUrl.toString());
    } catch (e) {
      _isRedirecting = false;
      state = state.copyWith(lastError: e.toString());
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
      state = state.copyWith(lastError: e.toString());
      return null;
    }
  }

  Future<void> logout() async {
    try {
      web.window.localStorage.removeItem('auth_token');
      web.window.localStorage.removeItem('pkce_code_verifier');

      await _session.clear();

      state = AuthState.initial().copyWith(isLoading: true);

      var returnUrl = AuthConfig.redirectUri.replaceAll(RegExp(r'/$'), '');

      final logoutUrl = Uri.https(AuthConfig.domain, '/v2/logout', {
        'client_id': AuthConfig.clientId,
        'returnTo': returnUrl,
      });

      debugPrint('[AuthNotifier] Logging out, redirecting to: $logoutUrl');

      await Future.delayed(const Duration(milliseconds: 100));

      web.window.location.assign(logoutUrl.toString());
    } catch (e) {
      debugPrint('[AuthNotifier] Error during logout: $e');
      try {
        web.window.localStorage.removeItem('auth_token');
        web.window.localStorage.removeItem('pkce_code_verifier');
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

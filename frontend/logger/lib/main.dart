import 'package:flutter/material.dart';
import 'package:auth0_flutter/auth0_flutter.dart';
import 'package:auth0_flutter/auth0_flutter_web.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';

void main() => runApp(const ProviderScope(child: MyApp()));

class MyApp extends StatefulWidget {
  const MyApp({super.key});
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  static const kDomain = 'dev-ohuspam6fnmh4tgt.us.auth0.com';
  static const kClientId = '2H45P97qEyC9HfiKFj8FOvb8DnSOgFwY';
  static const kRedirectUri = 'http://localhost:8080';

  late final Auth0Web auth0;
  Credentials? _credentials;
  String? _lastError;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    auth0 = Auth0Web(kDomain, kClientId);
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    try {
      // First check if user is already authenticated
      final creds = await auth0.onLoad();
      if (creds != null) {
        setState(() {
          _credentials = creds;
          _isLoading = false;
        });
      } else {
        // If not authenticated, automatically trigger login
        await _login();
      }
    } catch (e) {
      setState(() {
        _lastError = '$e';
        _isLoading = false;
      });
    }
  }

  Future<void> _login() async {
    try {
      await auth0.loginWithRedirect(redirectUrl: kRedirectUri);
    } catch (e) {
      setState(() => _lastError = '$e');
    }
  }

  Future<void> _logout() async {
    try {
      await auth0.logout();
      setState(() => _credentials = null);
    } catch (e) {
      setState(() => _lastError = '$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                const Text('Iniciando sesión...'),
                if (_lastError != null) ...[
                  const SizedBox(height: 12),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 520),
                    child: Text('Error: $_lastError',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.red)),
                  )
                ],
              ],
            ),
          ),
        ),
      );
    }

    if (_credentials == null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Error de autenticación'),
                if (_lastError != null) ...[
                  const SizedBox(height: 12),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 520),
                    child: Text('Error: $_lastError',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.red)),
                  )
                ],
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _initializeAuth,
                  child: const Text('Reintentar'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final userName =
        _credentials!.user.name ?? _credentials!.user.nickname ?? 'Usuario';

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Stack(
        children: [
          MissionaryApp(userName: userName),
          Positioned(
            right: 16,
            top: 16,
            child: FilledButton.tonal(
              onPressed: _logout,
              child: Text('Salir (${_credentials!.user.email ?? userName})'),
            ),
          ),
        ],
      ),
    );
  }
}

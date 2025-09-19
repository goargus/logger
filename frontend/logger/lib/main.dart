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

  @override
  void initState() {
    super.initState();
    auth0 = Auth0Web(kDomain, kClientId);

    auth0.onLoad().then((creds) {
      setState(() => _credentials = creds);
    }).catchError((e) {
      setState(() => _lastError = '$e');
    });
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
    if (_credentials == null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ElevatedButton.icon(
                  onPressed: _login,
                  icon: const Icon(Icons.login),
                  label: const Text('Iniciar sesión con Auth0'),
                ),
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

import 'package:flutter/material.dart';
import 'package:auth0_flutter/auth0_flutter.dart';
import 'package:auth0_flutter/auth0_flutter_web.dart';
import 'package:http/http.dart' as http;

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Auth0 + Flutter Web',
        theme: ThemeData(useMaterial3: true),
        home: const HomePage(),
      );
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  // 🔁 Reemplaza con tus valores reales
  static const domain = 'dev-ohuspam6fnmh4tgt.us.auth0.com';
  static const clientId = '2H45P97qEyC9HfiKFj8FOvb8DnSOgFwY';
  static const redirectUrl = 'http://localhost:3000';
  static const audience = 'logger'; // Identifier de tu API en Auth0

  late final Auth0Web auth0;
  Credentials? _creds;
  String _apiResult = '';

  @override
  void initState() {
    super.initState();

    // Inicializa el cliente Web
    auth0 = Auth0Web(domain, clientId);

    // onLoad captura retorno del redirect y/o sesión previa
    auth0.onLoad().then((creds) {
      if (!mounted) return;
      setState(() => _creds = creds);
    }).catchError((err) {
      // No es un error fatal si no vienes de redirect
      debugPrint('Auth0 onLoad() sin sesión o error: $err');
    });
  }

  Future<void> _login() async {
    await auth0.loginWithRedirect(
      redirectUrl: redirectUrl,
      audience: audience, // en esta versión se pasa directo
    );
  }

  Future<void> _logout() async {
    await auth0.logout(); // opcional: returnTo: redirectUrl
    if (!mounted) return;
    setState(() {
      _creds = null;
      _apiResult = '';
    });
  }

  Future<void> _callApi() async {
    if (_creds?.accessToken == null) {
      setState(() => _apiResult = 'No hay accessToken. Inicia sesión primero.');
      return;
    }
    try {
      final resp = await http.get(
        Uri.parse('http://localhost:3333/protegido'), // ⬅️ tu endpoint NestJS
        headers: {'Authorization': 'Bearer ${_creds!.accessToken}'},
      );
      setState(() => _apiResult = '${resp.statusCode}: ${resp.body}');
    } catch (e) {
      setState(() => _apiResult = 'Error llamando API: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _creds?.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Auth0 + Flutter Web')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              if (_creds == null) ...[
                const Text(
                  'No has iniciado sesión.',
                  style: TextStyle(fontSize: 18),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _login,
                  child: const Text('Iniciar sesión'),
                ),
              ] else ...[
                const Text('Sesión iniciada', style: TextStyle(fontSize: 18)),
                const SizedBox(height: 8),
                if (user?.name != null) Text('Hola, ${user!.name!}'),
                if (user?.email != null) Text(user!.email!),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton(
                      onPressed: _callApi,
                      child: const Text('Llamar API protegida'),
                    ),
                    const SizedBox(width: 12),
                    OutlinedButton(
                      onPressed: _logout,
                      child: const Text('Cerrar sesión'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  _apiResult.isEmpty ? 'Sin llamadas aún.' : _apiResult,
                  textAlign: TextAlign.center,
                ),
              ],
            ]),
          ),
        ),
      ),
    );
  }
}

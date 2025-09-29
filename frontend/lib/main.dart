import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'providers/auth.dart';

void main() => runApp(const ProviderScope(child: MyApp()));

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final authNotifier = ref.read(authProvider.notifier);

    if (!authState.isAuthenticated) {
      if (!authState.isLoading && authState.error == null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          authNotifier.login();
        });
      }

      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (authState.isLoading) ...[
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  const Text('Redirigiendo a Auth0...'),
                ],
                if (authState.error != null) ...[
                  const Icon(Icons.error, color: Colors.red, size: 48),
                  const SizedBox(height: 16),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 520),
                    child: Text('Error: ${authState.error}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.red)),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      authNotifier.clearError();
                    },
                    child: const Text('Reintentar'),
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    }

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Stack(
        children: [
          const MissionaryApp(),
          Positioned(
            right: 16,
            top: 16,
            child: FilledButton.tonal(
              onPressed: authNotifier.logout,
              child: Consumer(
                builder: (context, ref, _) {
                  final authState = ref.watch(authProvider);
                  final userName = authState.credentials?.user.name ??
                      authState.credentials?.user.nickname ??
                      'Usuario';
                  return Text(
                      'Salir (${authState.credentials?.user.email ?? userName})');
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

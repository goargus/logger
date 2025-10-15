import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'providers/auth.dart';

void main() => runApp(const ProviderScope(child: MyApp()));

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final authNotifier = ref.read(authNotifierProvider.notifier);

    if (!authState.isAuthenticated) {
      if (!authState.isLoading && authState.lastError == null) {
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
                if (authState.lastError != null) ...[
                  const Icon(Icons.error, color: Colors.red, size: 48),
                  const SizedBox(height: 16),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 520),
                    child: Text('Error: ${authState.lastError}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.red)),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      authNotifier.login();
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
                  final authState = ref.watch(authNotifierProvider);
                  final userName = authState.user?['name'] ??
                      authState.user?['nickname'] ??
                      'Usuario';
                  return Text(
                      'Salir (${authState.user?['email'] ?? userName})');
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

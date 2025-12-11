import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../nav/sidebar_nav.dart';
import '../../providers/auth.dart';

const double kOverlayTopInset = 64.0;

class AppShell extends ConsumerWidget {
  final Widget body;
  final String activeRoute;

  const AppShell({
    super.key,
    required this.body,
    required this.activeRoute,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isWide = MediaQuery.of(context).size.width >= 1000;
    final authState = ref.watch(authNotifierProvider);
    final userName = authState.user?['name'] ?? 
                     authState.user?['nickname'] ?? 
                     'Usuario';
    final userEmail = authState.user?['email'] ?? '';
    final userPicture = authState.user?['picture'];

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.only(top: kOverlayTopInset),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isWide) const SizedBox(width: 8),
                  if (isWide)
                    SidebarNav(
                      userName: userName,
                      userEmail: userEmail,
                      userPicture: userPicture,
                      onCreateActivity: () => Navigator.pushNamed(context, '/activities/new'),
                    ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: body,
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              top: 8,
              right: 12,
              child: Consumer(
                builder: (context, ref, _) {
                  final authState = ref.watch(authNotifierProvider);
                  final authNotifier = ref.read(authNotifierProvider.notifier);
                  final userEmail = authState.user?['email'];
                  return ActionChip(
                    label: Text(
                      userEmail != null && userEmail.isNotEmpty
                          ? 'Salir ($userEmail)'
                          : 'Salir',
                    ),
                    onPressed: authNotifier.logout,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

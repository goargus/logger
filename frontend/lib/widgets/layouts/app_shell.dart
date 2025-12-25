import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../nav/sidebar_nav.dart';
import '../../providers/auth.dart';
import '../../core/layout_constants.dart';

class AppShell extends ConsumerWidget {
  final Widget child;
  final String currentPath;

  const AppShell({
    super.key,
    required this.child,
    required this.currentPath,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final userName = authState.user?['first_name'] ??
        authState.user?['name'] ??
        authState.user?['nickname'] ??
        'Usuario';
    final userEmail = authState.user?['email'] ?? '';
    final userPicture = authState.user?['picture'];

    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: SafeArea(
          top: true,
          child: Row(
            mainAxisSize: MainAxisSize.max,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (MediaQuery.of(context).size.width >
                  LayoutConstants.desktopBreakpoint)
                SidebarNav(
                  userName: userName,
                  userEmail: userEmail,
                  userPicture: userPicture,
                  currentPath: currentPath,
                ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(
                    LayoutConstants.spacing20,
                    LayoutConstants.spacing20,
                    LayoutConstants.spacing20,
                    0.0,
                  ),
                  child: child,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

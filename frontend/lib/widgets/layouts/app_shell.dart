import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../nav/sidebar_nav.dart';
import '../nav/mobile_drawer.dart';
import '../../providers/auth.dart';
import '../../core/layout_constants.dart';
import '../../theme/app_theme.dart';

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

    final isDesktop =
        MediaQuery.of(context).size.width > LayoutConstants.desktopBreakpoint;

    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        appBar: isDesktop
            ? null
            : AppBar(
                backgroundColor: AppTheme.sidebarStart,
                foregroundColor: Colors.white,
                leading: Builder(
                  builder: (context) => IconButton(
                    icon: const Icon(Icons.menu),
                    onPressed: () => Scaffold.of(context).openDrawer(),
                    tooltip: 'Menu',
                  ),
                ),
                title: _buildAppBarTitle(context),
                elevation: 0,
              ),
        drawer: isDesktop
            ? null
            : MobileDrawer(
                userName: userName,
                userEmail: userEmail,
                userPicture: userPicture,
                currentPath: currentPath,
              ),
        body: SafeArea(
          top: isDesktop,
          child: Row(
            mainAxisSize: MainAxisSize.max,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isDesktop)
                SidebarNav(
                  userName: userName,
                  userEmail: userEmail,
                  userPicture: userPicture,
                  currentPath: currentPath,
                ),
              Expanded(
                child: Padding(
                  padding: EdgeInsetsDirectional.fromSTEB(
                    isDesktop
                        ? LayoutConstants.spacing20
                        : LayoutConstants.spacing12,
                    isDesktop
                        ? LayoutConstants.spacing20
                        : LayoutConstants.spacing12,
                    isDesktop
                        ? LayoutConstants.spacing20
                        : LayoutConstants.spacing12,
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

  Widget _buildAppBarTitle(BuildContext context) {
    String title;
    switch (currentPath) {
      case '/':
        title = 'Dashboard';
        break;
      case '/activities':
        title = 'Actividades';
        break;
      case '/reports':
        title = 'Reportes';
        break;
      case '/leadership':
        title = 'Rendimiento';
        break;
      default:
        if (currentPath.startsWith('/activities/')) {
          title = 'Actividades';
        } else if (currentPath.startsWith('/reports/')) {
          title = 'Reportes';
        } else {
          title = 'Secretary';
        }
    }
    return Text(
      title,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
    );
  }
}

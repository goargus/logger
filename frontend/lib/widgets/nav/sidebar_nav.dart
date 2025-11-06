import 'package:flutter/material.dart';

import '../../core/layout_constants.dart';
import '../../routes.dart';
import '../../theme/app_theme.dart';

class SidebarNav extends StatelessWidget {
  final String userName;
  final String userEmail;
  final String? userPicture;
  final VoidCallback onCreateActivity;

  const SidebarNav({
    super.key,
    required this.userName,
    required this.userEmail,
    this.userPicture,
    required this.onCreateActivity,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: LayoutConstants.sidebarWidth,
      height: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            AppTheme.sidebarStart,
            AppTheme.sidebarEnd,
          ],
          stops: [0.0, 1.0],
          begin: AlignmentDirectional(0.0, -1.0),
          end: AlignmentDirectional(0, 1.0),
        ),
        border: Border.all(
          color: Theme.of(context).dividerColor,
          width: LayoutConstants.borderWidth1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(
          0.0,
          LayoutConstants.spacing24,
          0.0,
          LayoutConstants.spacing16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.max,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Logo
            _buildLogo(),
            Divider(
              height: LayoutConstants.dividerHeight,
              thickness: LayoutConstants.dividerThickness,
              color: Theme.of(context).dividerColor,
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(
                  0.0,
                  LayoutConstants.spacing80,
                  0.0,
                  0.0,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.max,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildNavigationLabel(context),
                    _buildDashboardNavItem(context),
                    _buildCreateActivityNavItem(context),
                    _buildReportsNavItem(context),
                    const SizedBox(height: LayoutConstants.spacing12),
                  ],
                ),
              ),
            ),
            Divider(
              height: LayoutConstants.dividerHeight,
              thickness: LayoutConstants.dividerThickness,
              color: Theme.of(context).dividerColor,
            ),
            _buildUserProfile(context),
          ],
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(
        LayoutConstants.spacing16,
        0.0,
        LayoutConstants.spacing16,
        LayoutConstants.spacing12,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.max,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(LayoutConstants.borderRadius8),
            child: Image.asset(
              'assets/images/LOGO2.png',
              width: LayoutConstants.logoSize,
              height: LayoutConstants.logoSize,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  width: LayoutConstants.logoSize,
                  height: LayoutConstants.logoSize,
                  color: Colors.white24,
                  child: const Icon(
                    Icons.church,
                    size: 60,
                    color: Colors.white,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationLabel(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(
        LayoutConstants.spacing16,
        LayoutConstants.spacing12,
        0.0,
        0.0,
      ),
      child: Text(
        'Platform Navigation',
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: Colors.white70,
              letterSpacing: 0.0,
            ),
      ),
    );
  }

  Widget _buildDashboardNavItem(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(
        LayoutConstants.spacing16,
        0.0,
        LayoutConstants.spacing16,
        0.0,
      ),
      child: Container(
        width: double.infinity,
        height: LayoutConstants.navItemHeight,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(LayoutConstants.borderRadius12),
        ),
        child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(
            LayoutConstants.spacing8,
            0.0,
            LayoutConstants.spacing6,
            0.0,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.max,
            children: [
              const Icon(
                Icons.dashboard,
                color: Colors.white,
                size: LayoutConstants.iconSize,
              ),
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(
                  LayoutConstants.spacing12,
                  0.0,
                  0.0,
                  0.0,
                ),
                child: Text(
                  'Dashboard',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white,
                        letterSpacing: 0.0,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCreateActivityNavItem(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(
        LayoutConstants.spacing16,
        0.0,
        LayoutConstants.spacing16,
        0.0,
      ),
      child: InkWell(
        onTap: onCreateActivity,
        child: Container(
          width: double.infinity,
          height: LayoutConstants.navItemHeight,
          decoration: BoxDecoration(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(LayoutConstants.borderRadius12),
          ),
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(
              LayoutConstants.spacing8,
              0.0,
              LayoutConstants.spacing6,
              0.0,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.max,
              children: [
                const Icon(
                  Icons.add_circle_outline,
                  color: Colors.white,
                  size: LayoutConstants.iconSize,
                ),
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(
                    LayoutConstants.spacing12,
                    0.0,
                    0.0,
                    0.0,
                  ),
                  child: Text(
                    'Nueva Actividad',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white,
                          letterSpacing: 0.0,
                        ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildReportsNavItem(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(
        LayoutConstants.spacing16,
        0.0,
        LayoutConstants.spacing16,
        0.0,
      ),
      child: InkWell(
        onTap: () => Navigator.pushNamed(context, Routes.reports),
        child: Container(
          width: double.infinity,
          height: LayoutConstants.navItemHeight,
          decoration: BoxDecoration(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(LayoutConstants.borderRadius12),
          ),
          child: Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(
              LayoutConstants.spacing8,
              0.0,
              LayoutConstants.spacing6,
              0.0,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.max,
              children: [
                const Icon(
                  Icons.bar_chart,
                  color: Colors.white,
                  size: LayoutConstants.iconSize,
                ),
                Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(
                    LayoutConstants.spacing12,
                    0.0,
                    0.0,
                    0.0,
                  ),
                  child: Text(
                    'Reportes',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.white,
                          letterSpacing: 0.0,
                        ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildUserProfile(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(
        LayoutConstants.spacing16,
        LayoutConstants.spacing12,
        LayoutConstants.spacing16,
        LayoutConstants.spacing12,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.max,
        children: [
          Container(
            width: LayoutConstants.profileImageSize,
            height: LayoutConstants.profileImageSize,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius:
                  BorderRadius.circular(LayoutConstants.borderRadius12),
              border: Border.all(
                color: Colors.white,
                width: LayoutConstants.borderWidth2,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(2.0),
              child: ClipRRect(
                borderRadius:
                    BorderRadius.circular(LayoutConstants.borderRadius8),
                child: userPicture != null
                    ? Image.network(
                        userPicture!,
                        width: LayoutConstants.profileImageInner,
                        height: LayoutConstants.profileImageInner,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            width: LayoutConstants.profileImageInner,
                            height: LayoutConstants.profileImageInner,
                            color: Colors.white24,
                            child: const Icon(
                              Icons.person,
                              color: Colors.white,
                            ),
                          );
                        },
                      )
                    : Container(
                        width: LayoutConstants.profileImageInner,
                        height: LayoutConstants.profileImageInner,
                        color: Colors.white24,
                        child: const Icon(
                          Icons.person,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(
                LayoutConstants.spacing12,
                0.0,
                0.0,
                0.0,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.max,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    userName,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.white,
                          letterSpacing: 0.0,
                        ),
                  ),
                  Text(
                    userEmail,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white70,
                          letterSpacing: 0.0,
                        ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

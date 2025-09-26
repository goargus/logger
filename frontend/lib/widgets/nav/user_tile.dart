import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth.dart';

/// Minimal user tile. You can hide this using `showUserTile: false` in SideNav.
class UserTile extends ConsumerWidget {
  const UserTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final name = authState.credentials?.user.name ??
        authState.credentials?.user.nickname ??
        'Usuario';
    final email = authState.credentials?.user.email ?? '';
    final avatarUrl = authState.credentials?.user.pictureUrl?.toString();

    return Row(
      children: [
        CircleAvatar(
          radius: 22,
          backgroundColor: Colors.white24,
          backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
          child: avatarUrl == null
              ? const Icon(Icons.person, color: Colors.white70)
              : null,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                email,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white70,
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

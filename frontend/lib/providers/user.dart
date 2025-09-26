import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';

class UserState {
  final AppUser? user;
  final bool isLoading;
  final String? error;

  const UserState({
    this.user,
    this.isLoading = false,
    this.error,
  });

  UserState copyWith({
    AppUser? user,
    bool? isLoading,
    String? error,
  }) {
    return UserState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class UserNotifier extends StateNotifier<UserState> {
  UserNotifier() : super(const UserState());

  // TODO: Implement user data fetching and management
  // This will be implemented in the next phase

  void setUser(AppUser user) {
    state = state.copyWith(
      user: user,
      error: null,
      isLoading: false,
    );
  }

  void clearUser() {
    state = state.copyWith(
      user: null,
      error: null,
      isLoading: false,
    );
  }

  void setLoading(bool loading) {
    state = state.copyWith(isLoading: loading);
  }

  void setError(String error) {
    state = state.copyWith(
      error: error,
      isLoading: false,
    );
  }
}

final userProvider = StateNotifierProvider<UserNotifier, UserState>((ref) {
  return UserNotifier();
});

// Computed providers for easy access to user properties
final currentUserProvider = Provider<AppUser?>((ref) {
  return ref.watch(userProvider).user;
});

final userRoleProvider = Provider<String?>((ref) {
  final user = ref.watch(currentUserProvider);
  return user?.role.name;
});

final userAssociationProvider = Provider<String?>((ref) {
  final user = ref.watch(currentUserProvider);
  return user?.association;
});

final userFieldsProvider = Provider<List<String>>((ref) {
  final user = ref.watch(currentUserProvider);
  return user?.fields ?? [];
});

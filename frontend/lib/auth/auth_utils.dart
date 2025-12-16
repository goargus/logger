import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'session.dart';
import '../providers/auth.dart';

class AuthUtils {
  AuthUtils._();

  static Future<String?> getAccessTokenEnsured(WidgetRef ref) async {
    try {
      final authState = ref.read(authNotifierProvider);
      if (authState.isAuthenticated && authState.accessToken != null) {
        final token = authState.accessToken!;
        await Session.instance.setAccessToken(token);
        return token;
      }

      final sessionToken = await Session.instance.getAccessToken();
      if (sessionToken != null && sessionToken.isNotEmpty) {
        return sessionToken;
      }

      return null;
    } catch (e) {
      return null;
    }
  }
}

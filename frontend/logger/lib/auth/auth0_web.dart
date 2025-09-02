import 'dart:html' as html;
import 'dart:js_util' as js_util;

/// Bridge para invocar funciones definidas en web/auth0_bridge.js
class Auth0Web {
  /// Abre Universal Login
  static void login() {
    js_util.callMethod(html.window, 'auth0Login', const []);
  }

  /// Pide un access token silenciosamente (si hay sesión),
  /// lo guarda en localStorage y lo devuelve.
  static Future<String?> refreshTokenSilently() async {
    try {
      final p = js_util.callMethod(html.window, 'auth0Refresh', const []);
      final token = await js_util.promiseToFuture<String>(p);
      return token;
    } catch (_) {
      return null;
    }
  }

  /// Cierra sesión
  static void logout() {
    js_util.callMethod(html.window, 'auth0Logout', const []);
  }
}

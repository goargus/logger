import 'dart:html' as html;
import 'dart:js_util' as js_util;

class Auth0Web {
  static void login() {
    js_util.callMethod(html.window, 'auth0Login', const []);
  }


  static Future<String?> refreshTokenSilently() async {
    try {
      final promise = js_util.callMethod(html.window, 'auth0Refresh', const []);
      final token = await js_util.promiseToFuture<String>(promise);
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

import 'dart:html' as html;
import 'dart:js_util' as js_util;

class Auth0Web {
  static Future<void> waitUntilReady() async {
    try {
      final p = js_util.callMethod(html.window, 'auth0Ready', const []);
      await js_util.promiseToFuture(p);
    } catch (_) {
    }
  }

  static void login() {
    js_util.callMethod(html.window, 'auth0Login', const []);
  }

  static Future<String?> refreshTokenSilently() async {
    try {
      final p = js_util.callMethod(html.window, 'auth0Refresh', const []);
      final token = await js_util.promiseToFuture<String>(p);
      return token;
    } catch (_) {
      return null;
    }
  }

  static void logout() {
    js_util.callMethod(html.window, 'auth0Logout', const []);
  }
}

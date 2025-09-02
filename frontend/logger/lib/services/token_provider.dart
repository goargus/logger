import 'dart:html' as html;
import 'dart:js' as js;
import 'package:js/js_util.dart' as jsu;

Future<String> auth0AccessTokenProvider() async {
  try {
    final p = js.context.callMethod('auth0Refresh', []);
    final token = await jsu.promiseToFuture<String>(p);
    if (token.isNotEmpty) return token;
  } catch (_) {
  }

  final cached = html.window.localStorage['flutter.access_token'];
  if (cached != null && cached.isNotEmpty) return cached;

  throw Exception('No Auth0 access token available. Did you login?');
}

Future<void> auth0Login() async {
  final p = js.context.callMethod('auth0Login', []);
  await jsu.promiseToFuture(p);
}

void auth0Logout() {
  js.context.callMethod('auth0Logout', []);
}

import 'dart:html' as html;

class Session {
  Session._();
  static final Session instance = Session._();

  String? _accessToken;

  Future<void> setAccessToken(String token) async {
    _accessToken = token;
    html.window.localStorage['flutter.access_token'] = token;
  }

  Future<String?> getAccessToken() async {
    if (_accessToken != null && _accessToken!.isNotEmpty) return _accessToken;
    _accessToken = html.window.localStorage['flutter.access_token'];
    return _accessToken;
  }

  Future<void> clear() async {
    _accessToken = null;
    html.window.localStorage.remove('flutter.access_token');
  }
}

import 'package:web/web.dart' as web;

class Session {
  Session._();
  static final Session instance = Session._();

  String? _accessToken;

  Future<void> setAccessToken(String token) async {
    _accessToken = token;
    web.window.localStorage.setItem('flutter.access_token', token);
  }

  Future<String?> getAccessToken() async {
    if (_accessToken != null && _accessToken!.isNotEmpty) return _accessToken;
    _accessToken = web.window.localStorage.getItem('flutter.access_token');
    return _accessToken;
  }

  Future<void> clear() async {
    _accessToken = null;
    web.window.localStorage.removeItem('flutter.access_token');
  }
}

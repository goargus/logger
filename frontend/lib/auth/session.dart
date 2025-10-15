import 'package:web/web.dart' as web;
import 'session_interface.dart';

class Session implements SessionInterface {
  Session._();
  static final Session instance = Session._();
  
  factory Session() => instance;

  String? _accessToken;

  @override
  Future<void> setAccessToken(String token) async {
    _accessToken = token;
    web.window.localStorage.setItem('flutter.access_token', token);
  }
  
  @override
  Future<void> saveToken(String token) async {
    await setAccessToken(token);
  }

  @override
  Future<String?> getAccessToken() async {
    if (_accessToken != null && _accessToken!.isNotEmpty) return _accessToken;
    _accessToken = web.window.localStorage.getItem('flutter.access_token');
    return _accessToken;
  }

  @override
  Future<void> clear() async {
    _accessToken = null;
    web.window.localStorage.removeItem('flutter.access_token');
  }
}

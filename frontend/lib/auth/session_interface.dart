abstract class SessionInterface {
  Future<void> setAccessToken(String token);
  Future<String?> getAccessToken();
  Future<void> clear();
}

abstract class SessionInterface {
  Future<void> setAccessToken(String token);
  Future<void> saveToken(String token); // Alias for backward compatibility
  Future<String?> getAccessToken();
  Future<void> clear();
}

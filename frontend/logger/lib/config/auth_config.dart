class AuthConfig {
  static const String domain = String.fromEnvironment('AUTH0_DOMAIN');
  static const String clientId = String.fromEnvironment('AUTH0_CLIENT_ID');
  static const String redirectUri = String.fromEnvironment('AUTH0_REDIRECT_URI');
}
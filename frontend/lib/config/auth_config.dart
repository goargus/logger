class AuthConfig {
  static const String domain = String.fromEnvironment('AUTH0_DOMAIN');
  static const String clientId = String.fromEnvironment('AUTH0_CLIENT_ID');

  static String get redirectUri => '${Uri.base.origin}/callback';

  static const String audience = String.fromEnvironment('AUTH0_AUDIENCE');

  static bool get isConfigured =>
      domain.isNotEmpty && clientId.isNotEmpty && audience.isNotEmpty;
}

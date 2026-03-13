class AuthConfig {
  // Shared
  static const String redirectUri = String.fromEnvironment('REDIRECT_URI');

  // Auth0
  static const String auth0Domain = String.fromEnvironment('AUTH0_DOMAIN');
  static const String auth0ClientId = String.fromEnvironment('AUTH0_CLIENT_ID');
  static const String auth0Audience = String.fromEnvironment('AUTH0_AUDIENCE');

  // Entra ID
  static const String entraTenantId = String.fromEnvironment('ENTRA_TENANT_ID');
  static const String entraClientId = String.fromEnvironment('ENTRA_CLIENT_ID');

  // Entra ID URLs (derived)
  static String get entraAuthorizeUrl =>
      'https://login.microsoftonline.com/$entraTenantId/oauth2/v2.0/authorize';

  static String get entraTokenUrl =>
      'https://login.microsoftonline.com/$entraTenantId/oauth2/v2.0/token';

  static String get entraLogoutUrl =>
      'https://login.microsoftonline.com/$entraTenantId/oauth2/v2.0/logout';

  static String get entraApiScope => 'api://$entraClientId/access_as_user';

  // Config checks
  static bool get isAuth0Configured =>
      auth0Domain.isNotEmpty && auth0ClientId.isNotEmpty && auth0Audience.isNotEmpty;

  static bool get isEntraConfigured =>
      entraTenantId.isNotEmpty && entraClientId.isNotEmpty;

  static bool get isConfigured => isAuth0Configured || isEntraConfigured;
}

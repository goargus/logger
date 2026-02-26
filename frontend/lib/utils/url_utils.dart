/// Removes OAuth callback parameters (code, state) from a URI,
/// preserving all other query parameters, path, and fragment.
/// Returns a relative URI string suitable for history.replaceState.
String stripAuthCallbackParams(Uri uri) {
  final cleanedParams = Map<String, String>.from(uri.queryParameters)
    ..remove('code')
    ..remove('state');

  return Uri(
    path: uri.path,
    queryParameters: cleanedParams.isEmpty ? null : cleanedParams,
    fragment: uri.fragment.isEmpty ? null : uri.fragment,
  ).toString();
}

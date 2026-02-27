import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'errors/app_exception.dart';

typedef AccessTokenProvider = Future<String> Function();

class ApiClient {
  ApiClient({
    required this.baseUrl,
    required this.getAccessToken,
    this.timeout = const Duration(seconds: 30),
  });

  final String baseUrl;
  final AccessTokenProvider getAccessToken;
  final Duration timeout;

  Future<dynamic> get(
    String path, {
    Map<String, String>? queryParameters,
    Map<String, String>? headers,
  }) async {
    final uri = _buildUri(path, queryParameters);
    final requestHeaders = await _buildHeaders(headers);

    try {
      final response =
          await http.get(uri, headers: requestHeaders).timeout(timeout);
      return _handleResponse(response);
    } catch (e) {
      throw _mapException(e);
    }
  }

  Future<dynamic> post(
    String path, {
    dynamic body,
    Map<String, String>? headers,
  }) async {
    final uri = _buildUri(path);
    final requestHeaders = await _buildHeaders(headers);

    try {
      final response = await http
          .post(
            uri,
            headers: requestHeaders,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(timeout);
      return _handleResponse(response);
    } catch (e) {
      throw _mapException(e);
    }
  }

  Future<dynamic> put(
    String path, {
    dynamic body,
    Map<String, String>? headers,
  }) async {
    final uri = _buildUri(path);
    final requestHeaders = await _buildHeaders(headers);

    try {
      final response = await http
          .put(
            uri,
            headers: requestHeaders,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(timeout);
      return _handleResponse(response);
    } catch (e) {
      throw _mapException(e);
    }
  }

  Future<dynamic> patch(
    String path, {
    dynamic body,
    Map<String, String>? headers,
  }) async {
    final uri = _buildUri(path);
    final requestHeaders = await _buildHeaders(headers);

    try {
      final response = await http
          .patch(
            uri,
            headers: requestHeaders,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(timeout);
      return _handleResponse(response);
    } catch (e) {
      throw _mapException(e);
    }
  }

  Future<dynamic> delete(
    String path, {
    Map<String, String>? headers,
  }) async {
    final uri = _buildUri(path);
    final requestHeaders = await _buildHeaders(headers);

    try {
      final response =
          await http.delete(uri, headers: requestHeaders).timeout(timeout);
      return _handleResponse(response);
    } catch (e) {
      throw _mapException(e);
    }
  }

  /// Get raw response (for file downloads)
  Future<http.Response> getRaw(
    String path, {
    Map<String, String>? queryParameters,
    Map<String, String>? headers,
  }) async {
    final uri = _buildUri(path, queryParameters);
    final requestHeaders = await _buildHeaders(headers);
    // Don't set Content-Type for raw requests
    requestHeaders.remove('Content-Type');

    try {
      final response =
          await http.get(uri, headers: requestHeaders).timeout(timeout);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response;
      }

      // Handle errors
      _handleResponse(response);
      throw Exception('Unexpected error');
    } catch (e) {
      throw _mapException(e);
    }
  }

  Uri _buildUri(String path, [Map<String, String>? queryParameters]) {
    final url = baseUrl.endsWith('/') ? baseUrl : '$baseUrl/';
    final fullPath = path.startsWith('/') ? path.substring(1) : path;
    final uri = Uri.parse('$url$fullPath');

    if (queryParameters != null && queryParameters.isNotEmpty) {
      return uri.replace(queryParameters: queryParameters);
    }

    return uri;
  }

  Future<Map<String, String>> _buildHeaders(
      Map<String, String>? additionalHeaders) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    try {
      final token = await getAccessToken();
      if (token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    } catch (e) {
      throw AuthException.tokenExpired();
    }

    if (additionalHeaders != null) {
      headers.addAll(additionalHeaders);
    }

    return headers;
  }

  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) {
        return null;
      }
      try {
        return jsonDecode(response.body);
      } catch (e) {
        return response.body;
      }
    }

    final statusCode = response.statusCode;
    String? errorMessage;
    Map<String, dynamic>? errorBody;

    try {
      errorBody = jsonDecode(response.body) as Map<String, dynamic>?;
      errorMessage =
          errorBody?['message'] as String? ?? errorBody?['error'] as String?;
    } catch (e) {
      errorMessage = response.body;
    }

    if (statusCode == 400) {
      final errors = errorBody?['errors'] as Map<String, dynamic>?;
      if (errors != null) {
        final fieldErrors = errors.map(
          (key, value) => MapEntry(key, value.toString()),
        );
        throw ValidationException.fromFields(fieldErrors);
      }

      throw ValidationException(
        userMessage:
            errorMessage ?? 'Invalid request. Please check your input.',
        technicalMessage: 'Bad Request (400): ${response.body}',
      );
    }

    if (statusCode == 401) {
      throw AuthException.unauthorized();
    }

    if (statusCode == 403) {
      throw AuthException.forbidden();
    }

    if (statusCode == 404) {
      throw NotFoundException(
        userMessage: errorMessage ?? 'The requested resource was not found.',
        technicalMessage: 'Not Found (404): ${response.body}',
      );
    }

    if (statusCode == 409) {
      throw BusinessException(
        userMessage: errorMessage ??
            'A conflict occurred. The resource may already exist.',
        technicalMessage: 'Conflict (409): ${response.body}',
      );
    }

    if (statusCode == 422) {
      throw ValidationException(
        userMessage: errorMessage ?? 'The request could not be processed.',
        technicalMessage: 'Unprocessable Entity (422): ${response.body}',
      );
    }

    if (statusCode == 429) {
      throw BusinessException(
        userMessage: 'Too many requests. Please try again later.',
        technicalMessage: 'Too Many Requests (429)',
        shouldRetry: true,
      );
    }

    if (statusCode == 500) {
      throw ServerException.internalError();
    }

    if (statusCode == 502) {
      throw const ServerException(
        userMessage: 'Server is temporarily unavailable. Please try again.',
        technicalMessage: 'Bad Gateway (502)',
      );
    }

    if (statusCode == 503) {
      throw ServerException.serviceUnavailable();
    }

    if (statusCode == 504) {
      throw const ServerException(
        userMessage: 'The server took too long to respond. Please try again.',
        technicalMessage: 'Gateway Timeout (504)',
      );
    }

    if (statusCode >= 500) {
      throw ServerException(
        userMessage: 'A server error occurred. Please try again later.',
        technicalMessage: 'Server Error ($statusCode): ${response.body}',
      );
    }
    if (statusCode >= 400 && statusCode < 500) {
      throw BusinessException(
        userMessage: errorMessage ?? 'Request failed. Please try again.',
        technicalMessage: 'Client Error ($statusCode): ${response.body}',
      );
    }
    throw UnknownException(
      userMessage: 'An unexpected error occurred.',
      technicalMessage: 'HTTP $statusCode: ${response.body}',
    );
  }

  AppException _mapException(dynamic error) {
    if (error is AppException) {
      return error;
    }
    if (error is SocketException) {
      return NetworkException.noConnection();
    }

    if (error is TimeoutException) {
      return NetworkException.timeout();
    }

    if (error is HttpException) {
      return NetworkException(
        technicalMessage: 'HTTP Exception: ${error.message}',
      );
    }

    if (error is FormatException) {
      return const UnknownException(
        userMessage: 'Received invalid data from server.',
        technicalMessage: 'Format exception while parsing response',
      );
    }

    return UnknownException.fromError(error);
  }
}

import 'dart:async';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:logger/core/api_client.dart';
import 'package:logger/core/errors/app_exception.dart';

void main() {
  group('ApiClient._buildHeaders', () {
    test('throws AuthException.tokenExpired when token retrieval fails', () {
      final client = ApiClient(
        baseUrl: 'http://localhost',
        getAccessToken: () async => throw Exception('Auth0 SDK error'),
      );

      expect(
        () => client.get('/test'),
        throwsA(isA<AuthException>().having(
          (e) => e.technicalMessage,
          'technicalMessage',
          'Token expired',
        )),
      );
    });

    test('throws NetworkException on SocketException during token retrieval',
        () {
      final client = ApiClient(
        baseUrl: 'http://localhost',
        getAccessToken: () async =>
            throw const SocketException('Connection refused'),
      );

      expect(
        () => client.get('/test'),
        throwsA(isA<NetworkException>()),
      );
    });

    test('throws NetworkException on TimeoutException during token retrieval',
        () {
      final client = ApiClient(
        baseUrl: 'http://localhost',
        getAccessToken: () async =>
            throw TimeoutException('Token request timed out'),
      );

      expect(
        () => client.get('/test'),
        throwsA(isA<NetworkException>()),
      );
    });
  });
}

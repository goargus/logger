import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/activity_type.dart';

class HttpException implements Exception {
  final String message;
  final int? statusCode;
  final String? body;
  const HttpException(this.message, {this.statusCode, this.body});
  @override
  String toString() => 'HttpException($message, status: $statusCode)';
}

class UnauthorizedException implements Exception {
  final String message;
  const UnauthorizedException(this.message);
  @override
  String toString() => 'UnauthorizedException($message)';
}

typedef GetTokenFn = Future<String?> Function();

class ActivityTypeService {
  final String baseUrl;
  final String path;
  final GetTokenFn getAccessToken;
  final http.Client _client;

  ActivityTypeService({
    required this.baseUrl,
    required this.getAccessToken,
    this.path = '/activity-types/authorized',
    http.Client? client,
  }) : _client = client ?? http.Client();

  List _extractList(dynamic decoded) {
    if (decoded is List) return decoded;
    if (decoded is Map && decoded['data'] is List) {
      return decoded['data'] as List;
    }
    throw const FormatException('Unexpected response shape');
  }

  Future<List<ActivityType>> fetchAll() async {
    Future<List<ActivityType>> doFetch(String token) async {
      final uri = Uri.parse('$baseUrl$path');

      final resp = await _client.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      debugPrint('[ActivityTypeService] GET $uri -> ${resp.statusCode}');

      if (resp.statusCode == 200) {
        final decoded = jsonDecode(resp.body);
        final list = _extractList(decoded);
        return list.map<ActivityType>((e) {
          if (e is Map<String, dynamic>) return ActivityType.fromJson(e);
          if (e is Map) {
            return ActivityType.fromJson(Map<String, dynamic>.from(e));
          }
          throw const FormatException('Item is not an object');
        }).toList();
      }

      if (resp.statusCode == 401) {
        throw const UnauthorizedException(
            'Unauthorized (401): invalid or expired token');
      }

      throw HttpException(
        'Failed to load activity types',
        statusCode: resp.statusCode,
        body: resp.body,
      );
    }

    var token = await getAccessToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException('Missing access token');
    }

    try {
      return await doFetch(token);
    } on UnauthorizedException {
      final refreshed = await getAccessToken();
      if (refreshed != null && refreshed.isNotEmpty && refreshed != token) {
        debugPrint(
            '[ActivityTypeService] Retrying after 401 with refreshed token');
        return await doFetch(refreshed);
      }
      rethrow;
    }
  }

  void close() {
    _client.close();
  }
}

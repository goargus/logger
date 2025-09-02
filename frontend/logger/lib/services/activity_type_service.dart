import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/activity_type.dart';

class ActivityTypeService {
  final String baseUrl;
  final Future<String?> Function() getAccessToken;
  final http.Client _client;
  final String path;

  ActivityTypeService({
    required this.baseUrl,
    required this.getAccessToken,
    this.path = '/activity-types',
    http.Client? client,
  }) : _client = client ?? http.Client();

  Future<List<ActivityType>> fetchAll() async {
    final token = await getAccessToken();
    if (token == null || token.isEmpty) {
      throw const UnauthorizedException('Missing access token');
    }

    final uri = Uri.parse('$baseUrl$path');
    final resp = await _client.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      },
    );

    debugPrint('[ActivityTypeService] GET $uri -> ${resp.statusCode}');
    if (kDebugMode) {
      final preview = resp.body.length > 400 ? resp.body.substring(0, 400) + '…' : resp.body;
      debugPrint('[ActivityTypeService] body preview: $preview');
    }

    if (resp.statusCode == 200) {
      try {
        final decoded = jsonDecode(resp.body);
        final list = _extractList(decoded);
        return list.map<ActivityType>((e) {
          if (e is Map<String, dynamic>) return ActivityType.fromJson(e);
          if (e is Map) return ActivityType.fromJson(Map<String, dynamic>.from(e));
          throw const FormatException('Item is not an object');
        }).toList();
      } catch (e) {
        throw FormatException('Unexpected response format: $e');
      }
    }

    if (resp.statusCode == 401) {
      throw const UnauthorizedException('Unauthorized (401): invalid or expired token');
    }

    throw HttpException(
      'Failed to load activity types',
      statusCode: resp.statusCode,
      body: resp.body,
    );
  }

  List<dynamic> _extractList(dynamic decoded) {
    if (decoded is List) return decoded;
    if (decoded is Map) {
      for (final key in const ['data', 'items', 'result', 'results', 'rows']) {
        final v = decoded[key];
        if (v is List) return v;
      }
    }
    throw const FormatException('Response JSON does not contain a list');
  }

  void close() => _client.close();
}

class HttpException implements Exception {
  final String message;
  final int statusCode;
  final String? body;
  const HttpException(this.message, {required this.statusCode, this.body});
  @override
  String toString() => 'HttpException($statusCode): $message${body != null ? '\n$body' : ''}';
}

class UnauthorizedException implements Exception {
  final String message;
  const UnauthorizedException(this.message);
  @override
  String toString() => message;
}

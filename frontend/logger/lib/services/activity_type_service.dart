// lib/services/activity_type_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/activity_type.dart';

class ActivityTypeService {
  final String baseUrl;

  ActivityTypeService(this.baseUrl);

  Future<List<ActivityType>> fetchAll() async {
    final uri = Uri.parse('$baseUrl/activity-types');
    final resp = await http.get(uri);

    if (resp.statusCode != 200) {
      throw Exception('Error fetching activity types: ${resp.statusCode}');
    }

    final body = jsonDecode(resp.body);

    if (body is! List) {
      throw Exception('Unexpected response format: $body');
    }

    return body.map<ActivityType>((e) => ActivityType.fromJson(e)).toList();
  }
}

import 'package:flutter/foundation.dart';
import '../models/activity_type.dart';
import '../core/api_client.dart';
import '../core/errors/app_exception.dart';

typedef GetTokenFn = Future<String?> Function();

class ActivityTypeService {
  final ApiClient apiClient;
  final String path;

  ActivityTypeService({
    required this.apiClient,
    this.path = '/activity-types/authorized',
  });

  List _extractList(dynamic decoded) {
    if (decoded is List) return decoded;
    if (decoded is Map && decoded['data'] is List) {
      return decoded['data'] as List;
    }
    throw const ValidationException(
      userMessage: 'Received unexpected data format from server',
      technicalMessage: 'Unexpected response shape',
    );
  }

  Future<List<ActivityType>> fetchAll() async {
    try {
      final decoded = await apiClient.get(path);
      debugPrint('[ActivityTypeService] Successfully fetched activity types');

      final list = _extractList(decoded);
      return list.map<ActivityType>((e) {
        if (e is Map<String, dynamic>) return ActivityType.fromJson(e);
        if (e is Map) {
          return ActivityType.fromJson(Map<String, dynamic>.from(e));
        }
        throw const ValidationException(
          userMessage: 'Received invalid data format from server',
          technicalMessage: 'Item is not an object',
        );
      }).toList();
    } catch (e) {
      debugPrint('[ActivityTypeService] Error fetching activity types: $e');
      rethrow;
    }
  }
}

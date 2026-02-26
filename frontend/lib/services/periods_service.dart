import '../config/api_config.dart';
import '../core/api_client.dart';
import '../models/availability.dart';

class PeriodsService {
  PeriodsService({required this.apiClient});

  final ApiClient apiClient;

  factory PeriodsService.localhost(AccessTokenProvider getAccessToken) {
    final apiClient = ApiClient(
      baseUrl: ApiConfig.baseUrl,
      getAccessToken: getAccessToken,
    );
    return PeriodsService(apiClient: apiClient);
  }

  Future<AvailabilityResponse> getAvailability(String month) async {
    final data = await apiClient.get(
      'periods/availability',
      queryParameters: {'month': month},
    );
    return AvailabilityResponse.fromJson(data as Map<String, dynamic>);
  }
}

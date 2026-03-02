import 'package:flutter_test/flutter_test.dart';
import 'package:logger/services/reports_service.dart';
import 'package:logger/core/api_client.dart';
import 'package:logger/core/errors/app_exception.dart';

class ThrowingApiClient extends ApiClient {
  final Exception exception;
  ThrowingApiClient(this.exception)
      : super(baseUrl: 'http://test', getAccessToken: () async => 'token');

  @override
  Future<dynamic> get(String path,
      {Map<String, String>? queryParameters,
      Map<String, String>? headers}) async {
    throw exception;
  }
}

class _CapturingApiClient extends ApiClient {
  final dynamic response;
  final void Function(String path, Map<String, String>? params)? onGet;

  _CapturingApiClient({required this.response, this.onGet})
      : super(baseUrl: 'http://test', getAccessToken: () async => 'token');

  @override
  Future<dynamic> get(String path,
      {Map<String, String>? queryParameters,
      Map<String, String>? headers}) async {
    onGet?.call(path, queryParameters);
    return response;
  }
}

void main() {
  final exceptions = <String, Exception>{
    'AuthException': AuthException.unauthorized(),
    'NetworkException': const NetworkException(),
    'ServerException': ServerException.internalError(),
  };

  group('ReportsService error propagation', () {
    exceptions.forEach((name, exception) {
      group('propagates $name', () {
        late ReportsService service;

        setUp(() {
          service = ReportsService(apiClient: ThrowingApiClient(exception));
        });

        test('getPersonalSummary throws $name', () async {
          expect(
            () => service.getPersonalSummary(
              periodStart: '2024-01-01',
              periodEnd: '2024-01-31',
            ),
            throwsA(isA<AppException>()),
          );
        });

        test('getPersonalBreakdown throws $name', () async {
          expect(
            () => service.getPersonalBreakdown(
              periodStart: '2024-01-01',
              periodEnd: '2024-01-31',
            ),
            throwsA(isA<AppException>()),
          );
        });

        test('getEntityBreakdown throws $name', () async {
          expect(
            () => service.getEntityBreakdown(
              periodStart: '2024-01-01',
              periodEnd: '2024-01-31',
            ),
            throwsA(isA<AppException>()),
          );
        });

        test('getHierarchySummary throws $name', () async {
          expect(
            () => service.getHierarchySummary(),
            throwsA(isA<AppException>()),
          );
        });

        test('getEngagement throws $name', () async {
          expect(
            () => service.getEngagement(),
            throwsA(isA<AppException>()),
          );
        });

        test('getTrends throws $name', () async {
          expect(
            () => service.getTrends(),
            throwsA(isA<AppException>()),
          );
        });

        test('getComparison throws $name', () async {
          expect(
            () => service.getComparison(),
            throwsA(isA<AppException>()),
          );
        });

        test('getRankings throws $name', () async {
          expect(
            () => service.getRankings(),
            throwsA(isA<AppException>()),
          );
        });

        test('getExpenses throws $name', () async {
          expect(
            () => service.getExpenses(),
            throwsA(isA<AppException>()),
          );
        });
      });
    });

    group('Leadership endpoint methods', () {
      group('getTrends', () {
        test('should propagate exceptions', () {
          final service = ReportsService(
              apiClient: ThrowingApiClient(AuthException.forbidden()));
          expect(
            () =>
                service.getTrends(dateFrom: '2026-01-01', dateTo: '2026-01-31'),
            throwsA(isA<AuthException>()),
          );
        });

        test('should call correct endpoint', () async {
          String? capturedPath;
          final mockClient = _CapturingApiClient(
            response: {'periods': []},
            onGet: (path, params) => capturedPath = path,
          );
          final service = ReportsService(apiClient: mockClient);
          await service.getTrends(dateFrom: '2026-01-01', dateTo: '2026-01-31');
          expect(capturedPath, 'reports/trends');
        });
      });

      group('getComparison', () {
        test('should propagate exceptions', () {
          final service = ReportsService(
              apiClient: ThrowingApiClient(ServerException.internalError()));
          expect(
            () => service.getComparison(
                dateFrom: '2026-01-01', dateTo: '2026-01-31'),
            throwsA(isA<ServerException>()),
          );
        });

        test('should call correct endpoint', () async {
          String? capturedPath;
          final mockClient = _CapturingApiClient(
            response: {
              'current': {
                'periodId': '',
                'dates': '',
                'activities': 0,
                'expenses': 0.0,
                'activeRate': 0.0,
                'usersActive': 0,
              },
              'previous': {
                'periodId': '',
                'dates': '',
                'activities': 0,
                'expenses': 0.0,
                'activeRate': 0.0,
                'usersActive': 0,
              },
              'changes': {
                'activities': {'value': 0.0, 'percent': 0.0},
                'expenses': {'value': 0.0, 'percent': 0.0},
                'activeRate': {'value': 0.0, 'percent': 0.0},
                'usersActive': {'value': 0.0, 'percent': 0.0},
              },
            },
            onGet: (path, params) => capturedPath = path,
          );
          final service = ReportsService(apiClient: mockClient);
          await service.getComparison(
              dateFrom: '2026-01-01', dateTo: '2026-01-31');
          expect(capturedPath, 'reports/comparison');
        });
      });

      group('getRankings', () {
        test('should propagate exceptions', () {
          final service = ReportsService(
              apiClient: ThrowingApiClient(AuthException.forbidden()));
          expect(
            () => service.getRankings(
                dateFrom: '2026-01-01', dateTo: '2026-01-31'),
            throwsA(isA<AuthException>()),
          );
        });

        test('should call correct endpoint', () async {
          String? capturedPath;
          final mockClient = _CapturingApiClient(
            response: {
              'topPerformers': [],
              'lowestEngagement': [],
              'inactiveUsers': [],
            },
            onGet: (path, params) => capturedPath = path,
          );
          final service = ReportsService(apiClient: mockClient);
          await service.getRankings(
              dateFrom: '2026-01-01', dateTo: '2026-01-31');
          expect(capturedPath, 'reports/rankings');
        });
      });

      group('getExpenses', () {
        test('should propagate exceptions', () {
          final service = ReportsService(
              apiClient: ThrowingApiClient(NetworkException.timeout()));
          expect(
            () => service.getExpenses(
                dateFrom: '2026-01-01', dateTo: '2026-01-31'),
            throwsA(isA<NetworkException>()),
          );
        });

        test('should call correct endpoint', () async {
          String? capturedPath;
          final mockClient = _CapturingApiClient(
            response: {
              'total': 0.0,
              'byType': [],
              'byEntity': [],
              'byUser': [],
            },
            onGet: (path, params) => capturedPath = path,
          );
          final service = ReportsService(apiClient: mockClient);
          await service.getExpenses(
              dateFrom: '2026-01-01', dateTo: '2026-01-31');
          expect(capturedPath, 'reports/expenses');
        });
      });
    });
  });
}

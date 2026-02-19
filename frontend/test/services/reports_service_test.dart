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
          service =
              ReportsService(apiClient: ThrowingApiClient(exception));
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

        test('getCompliance throws $name', () async {
          expect(
            () => service.getCompliance(),
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
  });
}

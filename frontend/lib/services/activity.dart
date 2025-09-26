import 'dart:convert';
import 'package:http/http.dart' as http;

typedef AccessTokenProvider = Future<String> Function();

class ActivityService {
  ActivityService({
    required this.baseUrl,
    required this.getAccessToken,
  });

  final String baseUrl;

  final AccessTokenProvider getAccessToken;

  factory ActivityService.localhost(AccessTokenProvider getAccessToken) {
    return ActivityService(
      baseUrl: 'http://localhost:3000',
      getAccessToken: getAccessToken,
    );
  }

  Future<Map<String, dynamic>> createActivity({
    required String typeId,
    required DateTime date,
    String? description,
    bool hasExpense = false,
    String? expenseAmount,
  }) async {
    final token = await getAccessToken();
    final iso = date.toUtc().toIso8601String();

    final payload = <String, dynamic>{
      'activity_type_id': typeId,
      'type_id': typeId,
      'activity_date': iso,
      'date': iso,
      if (description != null && description.trim().isNotEmpty)
        'description': description.trim(),
      'hasExpense': hasExpense,
      'has_expense': hasExpense,
      if (hasExpense) ...{
        'expenseAmount': (expenseAmount ?? '0').trim(),
        'expense_amount': (expenseAmount ?? '0').trim(),
      },
    };

    final resp = await http.post(
      Uri.parse('$baseUrl/activities'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(payload),
    );

    if (resp.statusCode == 201 || resp.statusCode == 200) {
      return jsonDecode(resp.body) as Map<String, dynamic>;
    }

    throw Exception('Create activity failed: ${resp.statusCode} ${resp.body}');
  }

  Future<double> getMonthlyExpenseTotal({
    required int year,
    required int month,
  }) async {
    final token = await getAccessToken();

    final uri = Uri.parse('$baseUrl/activities/stats/monthly-expenses')
        .replace(queryParameters: {
      'year': year.toString(),
      'month': month.toString(),
    });

    final resp = await http.get(
      uri,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (resp.statusCode == 200) {
      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      return (data['total'] as num).toDouble();
    }

    throw Exception(
        'Get monthly expenses failed: ${resp.statusCode} ${resp.body}');
  }
}

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'activities.dart';

class MonthlyExpense {
  final double total;
  final int year;
  final int month;

  const MonthlyExpense({
    required this.total,
    required this.year,
    required this.month,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MonthlyExpense &&
          runtimeType == other.runtimeType &&
          total == other.total &&
          year == other.year &&
          month == other.month;

  @override
  int get hashCode => Object.hash(total, year, month);
}

class MonthlyExpensesNotifier extends AsyncNotifier<MonthlyExpense> {
  @override
  Future<MonthlyExpense> build() async {
    final now = DateTime.now();
    return _fetchExpenses(now.year, now.month);
  }

  Future<MonthlyExpense> _fetchExpenses(int year, int month) async {
    final service = ref.read(activityServiceProvider);
    final total = await service.getMonthlyExpenseTotal(
      year: year,
      month: month,
    );
    return MonthlyExpense(total: total, year: year, month: month);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    final now = DateTime.now();
    state = await AsyncValue.guard(() => _fetchExpenses(now.year, now.month));
  }

  Future<void> fetchForMonth(int year, int month) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchExpenses(year, month));
  }
}

final monthlyExpensesProvider =
    AsyncNotifierProvider<MonthlyExpensesNotifier, MonthlyExpense>(() {
  return MonthlyExpensesNotifier();
});

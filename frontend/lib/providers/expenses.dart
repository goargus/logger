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
    // Preserve current year/month from state, fallback to current date
    final currentData = state.valueOrNull;
    final year = currentData?.year ?? DateTime.now().year;
    final month = currentData?.month ?? DateTime.now().month;

    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchExpenses(year, month));
  }

  /// Fetches expense data for a specific month and year.
  ///
  /// Updates the state with expenses for the specified [year] and [month].
  /// The state transitions through loading -> data/error states.
  ///
  /// Use [refresh] to reload data for the currently selected period.
  Future<void> fetchForMonth(int year, int month) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchExpenses(year, month));
  }
}

final monthlyExpensesProvider =
    AsyncNotifierProvider<MonthlyExpensesNotifier, MonthlyExpense>(() {
  return MonthlyExpensesNotifier();
});

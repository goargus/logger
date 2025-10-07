class Activity {
  final String? id;
  final DateTime date;
  final String category;
  final String description;
  final double expense;

  const Activity({
    this.id,
    required this.date,
    required this.category,
    required this.description,
    required this.expense,
  });

  factory Activity.fromApi(Map<String, dynamic> data) {
    final activityDate = data['activityDate'] as String;
    final date = DateTime.parse(activityDate);

    final category = data['activityTypeName'] as String? ?? 'Actividad';
    final description = data['description'] as String? ?? '';

    final expenseAmount = data['expenseAmount'] as String?;
    final expense =
        expenseAmount != null ? double.tryParse(expenseAmount) ?? 0.0 : 0.0;

    return Activity(
      id: data['id'] as String?,
      date: date,
      category: category,
      description: description,
      expense: expense,
    );
  }
}

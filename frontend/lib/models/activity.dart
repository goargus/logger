class Activity {
  final String? id;
  final DateTime date;
  final String category;
  final String? activityTypeId;
  final String description;
  final double expense;
  final bool hasExpense;
  final bool locked;
  final String? reportingPeriodId;
  final String? reportingPeriodName;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? ownerUserId;
  final String? ownerUsername;

  const Activity({
    this.id,
    required this.date,
    required this.category,
    this.activityTypeId,
    required this.description,
    required this.expense,
    this.hasExpense = false,
    this.locked = false,
    this.reportingPeriodId,
    this.reportingPeriodName,
    this.status = 'active',
    this.createdAt,
    this.updatedAt,
    this.ownerUserId,
    this.ownerUsername,
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
      activityTypeId: data['activityTypeId'] as String?,
      description: description,
      expense: expense,
      hasExpense: data['hasExpense'] as bool? ?? false,
      locked: data['locked'] as bool? ?? false,
      reportingPeriodId: data['reportingPeriodId'] as String?,
      reportingPeriodName: data['reportingPeriodName'] as String?,
      status: data['status'] as String? ?? 'active',
      createdAt:
          data['createdAt'] != null ? DateTime.parse(data['createdAt']) : null,
      updatedAt:
          data['updatedAt'] != null ? DateTime.parse(data['updatedAt']) : null,
      ownerUserId: data['ownerUserId'] as String?,
      ownerUsername: data['ownerUsername'] as String?,
    );
  }
}

class Activity {
  final DateTime date;
  final String category;
  final String description;
  final double expense; // viático gastado

  const Activity({
    required this.date,
    required this.category,
    required this.description,
    required this.expense,
  });
}

class ActivityType {
  final String id;
  final String name;
  final String description;

  ActivityType({
    required this.id,
    required this.name,
    required this.description,
  });

  factory ActivityType.fromJson(Map<String, dynamic> json) {
    return ActivityType(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
    );
  }
}

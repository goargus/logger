class Validators {
  static String? required(String? value, {String fieldName = 'Este campo'}) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName es requerido';
    }
    return null;
  }

  static String? minLength(String? value, int min) {
    if (value == null || value.trim().isEmpty) return null;
    if (value.trim().length < min) {
      return 'Debe tener al menos $min caracteres';
    }
    return null;
  }

  static String? maxLength(String? value, int max) {
    if (value == null || value.trim().isEmpty) return null;
    if (value.trim().length > max) {
      return 'No debe exceder $max caracteres';
    }
    return null;
  }

  static String? positiveNumber(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    final number = double.tryParse(value.trim());
    if (number == null) {
      return 'Debe ser un número válido';
    }
    if (number <= 0) {
      return 'Debe ser un número positivo';
    }
    return null;
  }

  static String? dateNotInFuture(DateTime? value) {
    if (value == null) return null;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final selected = DateTime(value.year, value.month, value.day);
    if (selected.isAfter(today)) {
      return 'La fecha no puede ser futura';
    }
    return null;
  }

  static String? requiredField<T>(T? value, {String fieldName = 'Este campo'}) {
    if (value == null) {
      return '$fieldName es requerido';
    }
    return null;
  }

  static String? combine(List<String? Function()> validators) {
    for (final validator in validators) {
      final error = validator();
      if (error != null) return error;
    }
    return null;
  }
}

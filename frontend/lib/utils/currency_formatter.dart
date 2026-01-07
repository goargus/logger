/// Utility class for currency formatting.
class CurrencyFormatter {
  /// Formats a numeric value with the given currency symbol.
  ///
  /// Example: formatCurrency(123.45, 'L') => 'L123.45'
  static String format(double value, String currencySymbol, {int decimals = 2}) {
    return '$currencySymbol${value.toStringAsFixed(decimals)}';
  }

  /// Formats a string value (which may already be a number) with the given currency symbol.
  ///
  /// Example: formatString('123.45', 'L') => 'L123.45'
  static String formatString(String? value, String currencySymbol) {
    if (value == null || value.isEmpty) {
      return '${currencySymbol}0';
    }
    return '$currencySymbol$value';
  }
}

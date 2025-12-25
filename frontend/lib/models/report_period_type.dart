enum ReportPeriodType {
  monthly,
  quarterly,
  biannual,
  annual,
}

extension ReportPeriodTypeExtension on ReportPeriodType {
  String get displayName {
    switch (this) {
      case ReportPeriodType.monthly:
        return 'Mensual';
      case ReportPeriodType.quarterly:
        return 'Trimestral';
      case ReportPeriodType.biannual:
        return 'Semestral';
      case ReportPeriodType.annual:
        return 'Anual';
    }
  }

  String get apiValue {
    return name.toLowerCase();
  }

  int get maxPeriodIndex {
    switch (this) {
      case ReportPeriodType.monthly:
        return 12;
      case ReportPeriodType.quarterly:
        return 4;
      case ReportPeriodType.biannual:
        return 2;
      case ReportPeriodType.annual:
        return 1;
    }
  }
}

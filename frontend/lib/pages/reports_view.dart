import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/reports/summary_cards.dart';
import '../widgets/reports/period_type_selector.dart';
import '../widgets/reports/enhanced_time_selector.dart';
import '../widgets/reports/comparison_breakdown_table.dart';
import '../services/reports_service.dart';
import '../providers/auth.dart';
import '../auth/auth_utils.dart';
import '../models/report_summary.dart';
import '../models/report_breakdown.dart';
import '../models/report_period_type.dart';

/// Content-only widget for reports view - shell is handled by AppShell via router
class ReportsViewContent extends ConsumerStatefulWidget {
  const ReportsViewContent({super.key});

  @override
  ConsumerState<ReportsViewContent> createState() => _ReportsViewContentState();
}

class _ReportsViewContentState extends ConsumerState<ReportsViewContent> {
  late ReportsService _reportsService;
  bool _isLoading = false;
  ReportSummary? _summary;
  BreakdownsComparisonResponse? _comparisonBreakdown;

  ReportPeriodType _periodType = ReportPeriodType.monthly;
  int _year = DateTime.now().year;
  int _periodIndex = DateTime.now().month;

  @override
  void initState() {
    super.initState();
    _reportsService = ReportsService.localhost(
      () async => await AuthUtils.getAccessTokenEnsured(ref) ?? '',
    );
    _loadReports();
  }

  Future<void> _loadReports() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final periodBounds = _calculatePeriodBounds();
      final periodStart = periodBounds['start']!.toIso8601String();
      final periodEnd = periodBounds['end']!.toIso8601String();

      final summary = await _reportsService.getPersonalSummary(
        periodStart: periodStart,
        periodEnd: periodEnd,
      );

      final comparisonBreakdown =
          await _reportsService.getBreakdownWithComparison(
        periodType: _periodType,
        year: _year,
        month: _periodType == ReportPeriodType.monthly ? _periodIndex : null,
        quarter:
            _periodType == ReportPeriodType.quarterly ? _periodIndex : null,
        half: _periodType == ReportPeriodType.biannual ? _periodIndex : null,
      );

      if (mounted) {
        setState(() {
          _summary = summary;
          _comparisonBreakdown = comparisonBreakdown;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar reportes: $e')),
        );
      }
    }
  }

  Map<String, DateTime> _calculatePeriodBounds() {
    DateTime start;
    DateTime end;

    switch (_periodType) {
      case ReportPeriodType.monthly:
        start = DateTime(_year, _periodIndex, 1);
        end = DateTime(_year, _periodIndex + 1, 0, 23, 59, 59);
        break;
      case ReportPeriodType.quarterly:
        final startMonth = (_periodIndex - 1) * 3 + 1;
        start = DateTime(_year, startMonth, 1);
        end = DateTime(_year, startMonth + 3, 0, 23, 59, 59);
        break;
      case ReportPeriodType.biannual:
        final startMonth = (_periodIndex - 1) * 6 + 1;
        start = DateTime(_year, startMonth, 1);
        end = DateTime(_year, startMonth + 6, 0, 23, 59, 59);
        break;
      case ReportPeriodType.annual:
        start = DateTime(_year, 1, 1);
        end = DateTime(_year, 12, 31, 23, 59, 59);
        break;
    }

    return {'start': start, 'end': end};
  }

  void _onPeriodTypeChanged(ReportPeriodType newType) {
    setState(() {
      _periodType = newType;
      // Reset period index to appropriate default
      final now = DateTime.now();
      switch (newType) {
        case ReportPeriodType.monthly:
          _periodIndex = now.month;
          break;
        case ReportPeriodType.quarterly:
          _periodIndex = ((now.month - 1) ~/ 3) + 1;
          break;
        case ReportPeriodType.biannual:
          _periodIndex = now.month <= 6 ? 1 : 2;
          break;
        case ReportPeriodType.annual:
          _periodIndex = 1;
          break;
      }
      _year = now.year;
    });
    _loadReports();
  }

  void _previousPeriod() {
    setState(() {
      if (_periodIndex > 1) {
        _periodIndex--;
      } else {
        _year--;
        _periodIndex = _periodType.maxPeriodIndex;
      }
    });
    _loadReports();
  }

  void _nextPeriod() {
    setState(() {
      if (_periodIndex < _periodType.maxPeriodIndex) {
        _periodIndex++;
      } else {
        _year++;
        _periodIndex = 1;
      }
    });
    _loadReports();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Page Title
          const Text(
            'Mis Reportes',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 24),

          // Period Type Selector
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey.shade300, width: 1),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'Tipo de Período:',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: PeriodTypeSelector(
                          selectedType: _periodType,
                          onTypeChanged: _onPeriodTypeChanged,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  EnhancedTimeSelector(
                    periodType: _periodType,
                    year: _year,
                    periodIndex: _periodIndex,
                    onPrevious: _previousPeriod,
                    onNext: _nextPeriod,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Text(
                        'Estado: ${_summary?.statusLabel ?? "Activo"}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 16),
                      if (_summary?.isReported ?? false)
                        Row(
                          children: const [
                            Icon(
                              Icons.check_circle,
                              color: Colors.green,
                              size: 18,
                            ),
                            SizedBox(width: 4),
                            Text(
                              'Has reportado',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.green,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                  if (_comparisonBreakdown?.previousPeriod != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Comparando con: ${_comparisonBreakdown!.previousPeriod!.periodLabel}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Loading or Summary Cards
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(40.0),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_summary != null) ...[
            SummaryCards(
              activitiesCount: _summary!.totalActivities,
              expenses: _summary!.totalExpenses,
              isReported: _summary!.isReported,
              currencySymbol: ref.watch(currencySymbolProvider),
            ),
            const SizedBox(height: 32),
            if (_comparisonBreakdown != null)
              ComparisonBreakdownTable(
                breakdown: _comparisonBreakdown!.byType,
                showComparison: true,
                currencySymbol: ref.watch(currencySymbolProvider),
              ),
          ] else
            const Center(
              child: Padding(
                padding: EdgeInsets.all(40.0),
                child: Text('No hay datos disponibles'),
              ),
            ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

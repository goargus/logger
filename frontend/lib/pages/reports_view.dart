import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/layouts/app_shell.dart';
import '../widgets/layouts/responsive_container.dart';
import '../widgets/reports/time_selector.dart';
import '../widgets/reports/summary_cards.dart';
import '../widgets/reports/breakdown_table.dart';
import '../routes.dart';
import '../services/reports_service.dart';
import '../auth/auth_utils.dart';
import '../models/report_summary.dart';
import '../models/report_breakdown.dart';

class ReportsViewPage extends ConsumerStatefulWidget {
  const ReportsViewPage({super.key});

  @override
  ConsumerState<ReportsViewPage> createState() => _ReportsViewPageState();
}

class _ReportsViewPageState extends ConsumerState<ReportsViewPage> {
  late ReportsService _reportsService;
  bool _isLoading = false;
  ReportSummary? _summary;
  List<ReportBreakdown> _breakdown = [];
  DateTime _periodStart = DateTime.now();
  DateTime _periodEnd = DateTime.now();

  @override
  void initState() {
    super.initState();
    _reportsService = ReportsService.localhost(
      () async => await AuthUtils.getAccessTokenEnsured(ref) ?? '',
    );
    _initializePeriod();
    _loadReports();
  }

  void _initializePeriod() {
    final now = DateTime.now();
    _periodStart = DateTime(now.year, now.month, 1);
    _periodEnd = DateTime(now.year, now.month + 1, 0);
  }

  Future<void> _loadReports() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final periodStart = _periodStart.toIso8601String();
      final periodEnd = _periodEnd.toIso8601String();

      final summary = await _reportsService.getPersonalSummary(
        periodStart: periodStart,
        periodEnd: periodEnd,
      );

      final breakdown = await _reportsService.getPersonalBreakdown(
        periodStart: periodStart,
        periodEnd: periodEnd,
      );

      if (mounted) {
        setState(() {
          _summary = summary;
          _breakdown = breakdown;
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

  void _previousPeriod() {
    setState(() {
      _periodStart = DateTime(
        _periodStart.year,
        _periodStart.month - 1,
        1,
      );
      _periodEnd = DateTime(
        _periodStart.year,
        _periodStart.month + 1,
        0,
      );
    });
    _loadReports();
  }

  void _nextPeriod() {
    setState(() {
      _periodStart = DateTime(
        _periodStart.year,
        _periodStart.month + 1,
        1,
      );
      _periodEnd = DateTime(
        _periodStart.year,
        _periodStart.month + 2,
        0,
      );
    });
    _loadReports();
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      activeRoute: Routes.reports,
      body: ResponsiveContainer(
        child: SingleChildScrollView(
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

              // Period Selector Card
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
                      TimeSelector(
                        periodStart: _periodStart,
                        periodEnd: _periodEnd,
                        onPrevious: _previousPeriod,
                        onNext: _nextPeriod,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Text(
                            'Estado: ${_summary?.status ?? "Activo"}',
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
                ),
                const SizedBox(height: 32),
                BreakdownTable(breakdown: _breakdown),
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
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/user_activities.dart';
import '../models/report_period_type.dart';
import '../providers/hierarchy_reports_provider.dart';
import '../providers/auth.dart';
import '../utils/currency_formatter.dart';
import '../widgets/reports/activity_detail_dialog.dart';
import '../widgets/reports/period_type_selector.dart';
import '../widgets/reports/enhanced_time_selector.dart';
import '../widgets/reports/activity_distribution_chart.dart';

/// Page to display activities for a specific user
class UserActivitiesPage extends ConsumerStatefulWidget {
  const UserActivitiesPage({
    super.key,
    required this.userId,
  });

  final String userId;

  @override
  ConsumerState<UserActivitiesPage> createState() => _UserActivitiesPageState();
}

class _UserActivitiesPageState extends ConsumerState<UserActivitiesPage> {
  UserActivitiesResponse? _response;
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  late ReportPeriodType _periodType;
  late int _year;
  late int _periodIndex;
  late DateTime _periodStart;
  late DateTime _periodEnd;

  @override
  void initState() {
    super.initState();
    // Initialize with hierarchy state period
    final hierarchyState = ref.read(hierarchyReportsProvider);
    _periodType = hierarchyState.periodType;
    _year = hierarchyState.year;
    _periodIndex = hierarchyState.periodIndex;
    _periodStart = hierarchyState.periodStart;
    _periodEnd = hierarchyState.periodEnd;
    _loadActivities();
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
    final now = DateTime.now();
    int newPeriodIndex;

    switch (newType) {
      case ReportPeriodType.monthly:
        newPeriodIndex = now.month;
        break;
      case ReportPeriodType.quarterly:
        newPeriodIndex = ((now.month - 1) ~/ 3) + 1;
        break;
      case ReportPeriodType.biannual:
        newPeriodIndex = now.month <= 6 ? 1 : 2;
        break;
      case ReportPeriodType.annual:
        newPeriodIndex = 1;
        break;
    }

    setState(() {
      _periodType = newType;
      _year = now.year;
      _periodIndex = newPeriodIndex;
      final bounds = _calculatePeriodBounds();
      _periodStart = bounds['start']!;
      _periodEnd = bounds['end']!;
      _currentPage = 1;
    });
    _loadActivities();
  }

  void _previousPeriod() {
    setState(() {
      if (_periodIndex > 1) {
        _periodIndex--;
      } else {
        _year--;
        _periodIndex = _periodType.maxPeriodIndex;
      }
      final bounds = _calculatePeriodBounds();
      _periodStart = bounds['start']!;
      _periodEnd = bounds['end']!;
      _currentPage = 1;
    });
    _loadActivities();
  }

  void _nextPeriod() {
    setState(() {
      if (_periodIndex < _periodType.maxPeriodIndex) {
        _periodIndex++;
      } else {
        _year++;
        _periodIndex = 1;
      }
      final bounds = _calculatePeriodBounds();
      _periodStart = bounds['start']!;
      _periodEnd = bounds['end']!;
      _currentPage = 1;
    });
    _loadActivities();
  }

  Future<void> _loadActivities() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final reportsService = ref.read(reportsServiceProvider);

      final response = await reportsService.getUserActivities(
        userId: widget.userId,
        dateFrom: _formatDateForApi(_periodStart),
        dateTo: _formatDateForApi(_periodEnd),
        page: _currentPage,
        limit: 20,
      );

      setState(() {
        _response = response;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Error al cargar actividades: $e';
        _isLoading = false;
      });
    }
  }

  String _formatDateForApi(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Back button and header
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => context.pop(),
                tooltip: 'Volver',
              ),
              const SizedBox(width: 8),
              Text(
                'Actividades del Usuario',
                style: theme.textTheme.headlineSmall,
              ),
            ],
          ),
        ),

        // Period selector
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _buildPeriodSelector(theme),
        ),
        const SizedBox(height: 8),

        // Content
        Expanded(
          child: _buildContent(theme),
        ),
      ],
    );
  }

  Widget _buildPeriodSelector(ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Period type selector row
            Row(
              children: [
                Text(
                  'Tipo de Período:',
                  style: theme.textTheme.titleSmall?.copyWith(
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
            const SizedBox(height: 16),
            // Period navigation row
            Row(
              children: [
                Expanded(
                  child: EnhancedTimeSelector(
                    periodType: _periodType,
                    year: _year,
                    periodIndex: _periodIndex,
                    onPrevious: _previousPeriod,
                    onNext: _nextPeriod,
                  ),
                ),
                const SizedBox(width: 16),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _loadActivities,
                  tooltip: 'Actualizar',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(ThemeData theme) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
            const SizedBox(height: 16),
            Text(_error!, style: theme.textTheme.bodyLarge),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadActivities,
              child: const Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    if (_response == null || _response!.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_outlined,
                size: 48, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(height: 16),
            Text(
              'No hay actividades para este período',
              style: theme.textTheme.bodyLarge,
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User info card
          _buildUserInfoCard(theme),
          const SizedBox(height: 16),

          // Totals card
          _buildTotalsCard(theme),
          const SizedBox(height: 16),

          // Activity distribution charts
          if (_response!.activities.isNotEmpty)
            LayoutBuilder(
              builder: (context, constraints) {
                if (constraints.maxWidth > 700) {
                  // Side by side on wide screens
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: ActivityDistributionChart.fromActivities(
                          activities: _response!.activities,
                          title: 'Actividades por Tipo',
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: ActivityDistributionChart.fromActivities(
                          activities: _response!.activities,
                          title: 'Gastos por Tipo',
                          showExpenses: true,
                        ),
                      ),
                    ],
                  );
                }
                // Stacked on narrow screens
                return Column(
                  children: [
                    ActivityDistributionChart.fromActivities(
                      activities: _response!.activities,
                      title: 'Actividades por Tipo',
                    ),
                    const SizedBox(height: 16),
                    ActivityDistributionChart.fromActivities(
                      activities: _response!.activities,
                      title: 'Gastos por Tipo',
                      showExpenses: true,
                    ),
                  ],
                );
              },
            ),
          if (_response!.activities.isNotEmpty) const SizedBox(height: 16),

          // Activities list
          _buildActivitiesList(theme),

          // Pagination
          if (_response!.pagination.totalPages > 1) _buildPagination(theme),
        ],
      ),
    );
  }

  Widget _buildUserInfoCard(ThemeData theme) {
    final user = _response!.user;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            CircleAvatar(
              radius: 32,
              backgroundColor: theme.colorScheme.primaryContainer,
              child: Text(
                user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                style: theme.textTheme.headlineMedium?.copyWith(
                  color: theme.colorScheme.onPrimaryContainer,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.name,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    user.email,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      Chip(
                        avatar: const Icon(Icons.badge, size: 16),
                        label: Text(user.roleName),
                        visualDensity: VisualDensity.compact,
                      ),
                      Chip(
                        avatar: const Icon(Icons.location_on, size: 16),
                        label: Text(user.entityName),
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTotalsCard(ThemeData theme) {
    final totals = _response!.totals;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildTotalItem(
              theme,
              icon: Icons.assignment,
              label: 'Actividades',
              value: '${totals.count}',
            ),
            Container(
              height: 40,
              width: 1,
              color: theme.dividerColor,
            ),
            _buildTotalItem(
              theme,
              icon: Icons.attach_money,
              label: 'Gastos',
              value: CurrencyFormatter.format(
                  totals.expenses, ref.watch(currencySymbolProvider)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTotalItem(
    ThemeData theme, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, color: theme.colorScheme.primary),
        const SizedBox(height: 4),
        Text(
          value,
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.primary,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  Widget _buildActivitiesList(ThemeData theme) {
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.list, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Actividades',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _response!.activities.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final activity = _response!.activities[index];
              return _buildActivityTile(theme, activity);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActivityTile(ThemeData theme, UserActivity activity) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: theme.colorScheme.secondaryContainer,
        child: Icon(
          Icons.event_note,
          color: theme.colorScheme.onSecondaryContainer,
          size: 20,
        ),
      ),
      title: Text(activity.typeName),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (activity.description != null && activity.description!.isNotEmpty)
            Text(
              activity.description!,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          Text(
            _formatActivityDate(activity.date),
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (activity.hasExpense)
            Chip(
              avatar: const Icon(Icons.attach_money, size: 14),
              label: Text(CurrencyFormatter.formatString(
                  activity.expenseAmount, ref.watch(currencySymbolProvider))),
              visualDensity: VisualDensity.compact,
              backgroundColor: theme.colorScheme.tertiaryContainer,
            ),
          const SizedBox(width: 8),
          Icon(
            Icons.chevron_right,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ],
      ),
      isThreeLine:
          activity.description != null && activity.description!.isNotEmpty,
      onTap: () => _showActivityDetail(activity),
    );
  }

  void _showActivityDetail(UserActivity activity) {
    ActivityDetailDialog.show(
      context,
      activity: activity,
      userName: _response?.user.name,
      currencySymbol: ref.read(currencySymbolProvider),
    );
  }

  String _formatActivityDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  Widget _buildPagination(ThemeData theme) {
    final pagination = _response!.pagination;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: pagination.hasPreviousPage
                ? () {
                    setState(() => _currentPage--);
                    _loadActivities();
                  }
                : null,
          ),
          Text(
            'Página ${pagination.page} de ${pagination.totalPages}',
            style: theme.textTheme.bodyMedium,
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: pagination.hasNextPage
                ? () {
                    setState(() => _currentPage++);
                    _loadActivities();
                  }
                : null,
          ),
        ],
      ),
    );
  }
}

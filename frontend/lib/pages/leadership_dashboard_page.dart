import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/errors/app_exception.dart';
import '../models/leadership_dashboard_data.dart';
import '../models/report_period_type.dart';
import '../providers/leadership_dashboard_provider.dart';
import '../providers/auth.dart';
import '../router.dart';
import '../utils/currency_formatter.dart';
import '../models/leadership_reports.dart';
import '../widgets/reports/period_type_selector.dart';
import '../widgets/reports/enhanced_time_selector.dart';

/// Leadership Dashboard Page - Displays trends, comparison, rankings, and expenses
/// Requires REPORT_VIEW_HIERARCHY permission
class LeadershipDashboardContent extends ConsumerStatefulWidget {
  const LeadershipDashboardContent({super.key});

  @override
  ConsumerState<LeadershipDashboardContent> createState() =>
      _LeadershipDashboardContentState();
}

class _LeadershipDashboardContentState
    extends ConsumerState<LeadershipDashboardContent> {
  void _loadDashboard() {
    final authState = ref.read(authNotifierProvider);
    final primaryEntity =
        authState.user?['primary_entity'] as Map<String, dynamic>?;
    final entityId = primaryEntity?['id'] as String?;
    ref.read(leadershipDashboardProvider.notifier).loadDashboard(
          entityId: entityId,
        );
  }

  @override
  Widget build(BuildContext context) {
    final canView = ref.watch(canViewReportsProvider);
    if (!canView) {
      return const Center(
        child: Text('No tienes acceso a esta secci\u00f3n.'),
      );
    }

    final dashboardAsync = ref.watch(leadershipDashboardProvider);
    final theme = Theme.of(context);

    return dashboardAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _buildErrorState(error, theme),
      data: (data) => _buildDashboard(data, theme),
    );
  }

  Widget _buildErrorState(Object error, ThemeData theme) {
    String message;
    bool canRetry = false;

    if (error is AuthException) {
      message = error.userMessage;
    } else if (error is NetworkException) {
      message = error.userMessage;
      canRetry = true;
    } else if (error is ServerException) {
      message = error.userMessage;
      canRetry = true;
    } else if (error is AppException) {
      message = error.userMessage;
      canRetry = error.shouldRetry;
    } else {
      message = 'Error inesperado. Intente de nuevo.';
      canRetry = true;
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              error is AuthException ? Icons.lock_outline : Icons.error_outline,
              size: 64,
              color: error is AuthException
                  ? theme.colorScheme.primary.withValues(alpha: 0.7)
                  : theme.colorScheme.error,
            ),
            const SizedBox(height: 24),
            Text(
              error is AuthException ? 'Acceso Restringido' : 'Error',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: theme.textTheme.bodyLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            if (canRetry)
              ElevatedButton(
                onPressed: _loadDashboard,
                child: const Text('Reintentar'),
              )
            else if (error is AuthException)
              OutlinedButton.icon(
                onPressed: () => context.go(AppRoutes.reports),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Volver a Reportes'),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboard(LeadershipDashboardData data, ThemeData theme) {
    return RefreshIndicator(
      onRefresh: () async => _loadDashboard(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(theme),
            const SizedBox(height: 16),
            _buildPeriodControls(theme),
            const SizedBox(height: 16),
            _buildComparisonSection(data.comparison, theme),
            const SizedBox(height: 24),
            _buildTrendsSection(data.trends, theme),
            const SizedBox(height: 24),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 2,
                  child: _buildRankingsSection(data.rankings, theme),
                ),
                const SizedBox(width: 16),
                Expanded(
                  flex: 1,
                  child: _buildExpensesSection(data.expenses, theme),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    final notifier = ref.read(leadershipDashboardProvider.notifier);
    final periodType = notifier.periodType;
    final year = notifier.year;
    final periodIndex = notifier.periodIndex;

    String dateRangeText;
    switch (periodType) {
      case ReportPeriodType.monthly:
        const months = [
          'Ene',
          'Feb',
          'Mar',
          'Abr',
          'May',
          'Jun',
          'Jul',
          'Ago',
          'Sep',
          'Oct',
          'Nov',
          'Dic',
        ];
        dateRangeText = '${months[periodIndex - 1]} $year';
        break;
      case ReportPeriodType.quarterly:
        dateRangeText = 'Q$periodIndex $year';
        break;
      case ReportPeriodType.biannual:
        dateRangeText = 'Semestre $periodIndex $year';
        break;
      case ReportPeriodType.annual:
        dateRangeText = 'A\u00f1o $year';
        break;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Rendimiento',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'M\u00e9tricas de alto nivel para toma de decisiones',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 14,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        dateRangeText,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _loadDashboard,
              tooltip: 'Actualizar',
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPeriodControls(ThemeData theme) {
    final notifier = ref.read(leadershipDashboardProvider.notifier);

    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'Tipo de comparaci\u00f3n:',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: PeriodTypeSelector(
                    selectedType: notifier.periodType,
                    onTypeChanged: (type) {
                      notifier.updatePeriodType(type);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            EnhancedTimeSelector(
              periodType: notifier.periodType,
              year: notifier.year,
              periodIndex: notifier.periodIndex,
              onPrevious: () => notifier.previousPeriod(),
              onNext: () => notifier.nextPeriod(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildComparisonSection(
      ComparisonResponse comparison, ThemeData theme) {
    final hasNoComparisonData = comparison.current.activities == 0 &&
        comparison.current.expenses == 0 &&
        comparison.current.usersActive == 0 &&
        comparison.current.activeRate == 0 &&
        comparison.changes.activities.value == 0 &&
        comparison.changes.expenses.value == 0 &&
        comparison.changes.usersActive.value == 0 &&
        comparison.changes.activeRate.value == 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Comparaci\u00f3n de Per\u00edodos',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        if (hasNoComparisonData)
          Card(
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'No hay datos de actividades para comparar en este per\u00edodo.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
            ),
          )
        else
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 800;
              if (isWide) {
                return Row(
                  children: [
                    Expanded(
                      child: _buildComparisonCard(
                        'Actividades',
                        comparison.current.activities,
                        comparison.changes.activities,
                        Icons.assignment,
                        theme,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildComparisonCard(
                        'Gastos',
                        comparison.current.expenses,
                        comparison.changes.expenses,
                        Icons.attach_money,
                        theme,
                        isCurrency: true,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildComparisonCard(
                        'Participacion',
                        comparison.current.activeRate,
                        comparison.changes.activeRate,
                        Icons.check_circle,
                        theme,
                        isPercentage: true,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildComparisonCard(
                        'Usuarios Activos',
                        comparison.current.usersActive,
                        comparison.changes.usersActive,
                        Icons.people,
                        theme,
                      ),
                    ),
                  ],
                );
              } else {
                return Column(
                  children: [
                    _buildComparisonCard(
                      'Actividades',
                      comparison.current.activities,
                      comparison.changes.activities,
                      Icons.assignment,
                      theme,
                    ),
                    const SizedBox(height: 12),
                    _buildComparisonCard(
                      'Gastos',
                      comparison.current.expenses,
                      comparison.changes.expenses,
                      Icons.attach_money,
                      theme,
                      isCurrency: true,
                    ),
                    const SizedBox(height: 12),
                    _buildComparisonCard(
                      'Participacion',
                      comparison.current.activeRate,
                      comparison.changes.activeRate,
                      Icons.check_circle,
                      theme,
                      isPercentage: true,
                    ),
                    const SizedBox(height: 12),
                    _buildComparisonCard(
                      'Usuarios Activos',
                      comparison.current.usersActive,
                      comparison.changes.usersActive,
                      Icons.people,
                      theme,
                    ),
                  ],
                );
              }
            },
          ),
      ],
    );
  }

  Widget _buildComparisonCard(
    String label,
    num currentValue,
    Change change,
    IconData icon,
    ThemeData theme, {
    bool isCurrency = false,
    bool isPercentage = false,
  }) {
    String formattedValue;
    if (isCurrency) {
      formattedValue = CurrencyFormatter.format(currentValue.toDouble(), 'L');
    } else if (isPercentage) {
      formattedValue = '${currentValue.toStringAsFixed(1)}%';
    } else {
      formattedValue = currentValue.toString();
    }

    Color changeColor;
    IconData changeIcon;
    if (change.isNeutral) {
      changeColor = Colors.grey;
      changeIcon = Icons.remove;
    } else if (change.isPositive) {
      changeColor = Colors.green;
      changeIcon = Icons.arrow_upward;
    } else {
      changeColor = Colors.red;
      changeIcon = Icons.arrow_downward;
    }

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 24, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: theme.textTheme.titleMedium,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              formattedValue,
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(changeIcon, size: 16, color: changeColor),
                const SizedBox(width: 4),
                Text(
                  '${change.percent.abs().toStringAsFixed(1)}%',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: changeColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'vs per\u00edodo anterior',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrendsSection(TrendsResponse trends, ThemeData theme) {
    if (trends.periods.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Tendencias (\u00daltimos 5 Per\u00edodos)',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                columns: const [
                  DataColumn(label: Text('Per\u00edodo')),
                  DataColumn(label: Text('Actividades')),
                  DataColumn(label: Text('Gastos')),
                  DataColumn(label: Text('Participacion')),
                  DataColumn(label: Text('Usuarios')),
                ],
                rows: trends.periods.map((period) {
                  return DataRow(cells: [
                    DataCell(Text(
                      '${period.startDate.split('T')[0]} - ${period.endDate.split('T')[0]}',
                    )),
                    DataCell(Text(period.activities.toString())),
                    DataCell(Text(
                      CurrencyFormatter.format(period.expenses, 'L'),
                    )),
                    DataCell(Text('${period.activeRate.toStringAsFixed(1)}%')),
                    DataCell(
                        Text('${period.activeUsers}/${period.totalUsers}')),
                  ]);
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRankingsSection(RankingsResponse rankings, ThemeData theme) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Rankings y Alertas',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildRankingSubsection(
              'Top Performers',
              Icons.star,
              rankings.topPerformers.isEmpty
                  ? [const Text('Sin datos')]
                  : rankings.topPerformers
                      .map((performer) => ListTile(
                            dense: true,
                            leading: CircleAvatar(
                              backgroundColor: Colors.amber,
                              child: Text(
                                performer.name[0].toUpperCase(),
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                            title: Text(performer.name),
                            subtitle: Text(performer.entity),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${performer.count} actividades',
                                  style: theme.textTheme.bodySmall,
                                ),
                                Text(
                                  CurrencyFormatter.format(
                                      performer.expenses, 'L'),
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                              ],
                            ),
                            onTap: () => context.go(
                              AppRoutes.userActivitiesPath(performer.userId),
                            ),
                          ))
                      .toList(),
              theme,
            ),
            const Divider(height: 32),
            _buildRankingSubsection(
              'Baja Participacion',
              Icons.warning,
              rankings.lowestEngagement.isEmpty
                  ? [const Text('Sin datos')]
                  : rankings.lowestEngagement
                      .map((entity) => ListTile(
                            dense: true,
                            leading: Icon(
                              Icons.business,
                              color: Colors.orange,
                            ),
                            title: Text(entity.name),
                            subtitle: Text(
                                '${entity.rate.toStringAsFixed(1)}% participacion'),
                            trailing: Text(
                              '${entity.missing} faltantes',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.error,
                              ),
                            ),
                          ))
                      .toList(),
              theme,
            ),
            const Divider(height: 32),
            _buildRankingSubsection(
              'Usuarios Inactivos',
              Icons.person_off,
              rankings.inactiveUsers.isEmpty
                  ? [const Text('Sin datos')]
                  : rankings.inactiveUsers
                      .map((user) => ListTile(
                            dense: true,
                            leading: const Icon(
                              Icons.person_off,
                              color: Colors.grey,
                            ),
                            title: Text(user.name),
                            subtitle: Text(user.entity),
                            trailing: Text(
                              '${user.periodsInactive}+ per\u00edodos',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurface
                                    .withValues(alpha: 0.6),
                              ),
                            ),
                            onTap: () => context
                                .go(AppRoutes.userActivitiesPath(user.userId)),
                          ))
                      .toList(),
              theme,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRankingSubsection(
    String title,
    IconData icon,
    List<Widget> children,
    ThemeData theme,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 20),
            const SizedBox(width: 8),
            Text(
              title,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...children,
      ],
    );
  }

  Widget _buildExpensesSection(ExpensesResponse expenses, ThemeData theme) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Desglose de Gastos',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Total: ${CurrencyFormatter.format(expenses.total, 'L')}',
              style: theme.textTheme.headlineSmall?.copyWith(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Por Tipo',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            ...expenses.byType.take(5).map((expense) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              expense.name,
                              style: theme.textTheme.bodyMedium,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              '${expense.percent.toStringAsFixed(1)}%',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurface
                                    .withValues(alpha: 0.6),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        CurrencyFormatter.format(expense.total, 'L'),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                )),
            if (expenses.byType.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text('Sin datos de gastos'),
              ),
          ],
        ),
      ),
    );
  }
}

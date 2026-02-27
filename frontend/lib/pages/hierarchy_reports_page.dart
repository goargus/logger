import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../router.dart';
import '../widgets/hierarchy/entity_tree_view.dart';
import '../widgets/hierarchy/entity_breadcrumb.dart';
import '../widgets/hierarchy/hierarchy_breakdown_card.dart';
import '../widgets/reports/export_button.dart';
import '../widgets/reports/period_type_selector.dart';
import '../widgets/reports/enhanced_time_selector.dart';
import '../widgets/reports/users_report_table.dart';
import '../widgets/reports/activity_distribution_chart.dart';
import '../models/users_report.dart';
import '../models/compliance_report.dart';
import '../providers/hierarchy_reports_provider.dart';
import '../providers/auth.dart';
import '../services/pdf_service.dart';
import '../utils/currency_formatter.dart';

/// Content-only widget for hierarchy reports - shell is handled by AppShell via router
class HierarchyReportsContent extends ConsumerStatefulWidget {
  const HierarchyReportsContent({super.key});

  @override
  ConsumerState<HierarchyReportsContent> createState() =>
      _HierarchyReportsContentState();
}

class _HierarchyReportsContentState
    extends ConsumerState<HierarchyReportsContent> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeHierarchy();
    });
  }

  Future<void> _initializeHierarchy() async {
    final authState = ref.read(authNotifierProvider);
    final primaryEntity =
        authState.user?['primary_entity'] as Map<String, dynamic>?;
    final entityId = primaryEntity?['id'] as String?;

    if (entityId != null) {
      final notifier = ref.read(hierarchyReportsProvider.notifier);
      await notifier.loadHierarchy(entityId);
      await notifier.selectEntity(entityId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(hierarchyReportsProvider);
    final theme = Theme.of(context);

    if (state.isLoading && !state.hasHierarchy) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null && !state.hasHierarchy) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
            const SizedBox(height: 16),
            Text(state.error!, style: theme.textTheme.bodyLarge),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _initializeHierarchy,
              child: const Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        // Use side-by-side layout on wider screens
        final isWideScreen = constraints.maxWidth > 900;

        if (isWideScreen) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Left sidebar with tree navigation
              SizedBox(
                width: 300,
                child: _buildSidebar(state),
              ),
              const VerticalDivider(width: 1),
              // Right content area
              Expanded(
                child: _buildContent(state),
              ),
            ],
          );
        }

        // On narrow screens, use tabs or expandable sections
        return _buildMobileLayout(state);
      },
    );
  }

  Widget _buildSidebar(HierarchyReportsState state) {
    final theme = Theme.of(context);

    return Container(
      color: theme.colorScheme.surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              'Navegación Jerárquica',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: state.hierarchyTree != null
                ? EntityTreeView(
                    tree: state.hierarchyTree!,
                    selectedEntityId: state.selectedEntityId,
                    onEntitySelected: (node) {
                      ref
                          .read(hierarchyReportsProvider.notifier)
                          .selectEntity(node.id);
                    },
                  )
                : const Center(child: Text('No hay jerarquía disponible')),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(HierarchyReportsState state) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Breadcrumb navigation
          if (state.hierarchyTree != null && state.selectedEntityId != null)
            EntityTreeBreadcrumb(
              rootTree: state.hierarchyTree!,
              selectedEntityId: state.selectedEntityId!,
              onEntityTap: (entityId) {
                ref
                    .read(hierarchyReportsProvider.notifier)
                    .selectEntity(entityId);
              },
            ),
          const SizedBox(height: 16),

          // Period selector
          _buildPeriodSelector(state),
          const SizedBox(height: 24),

          // Loading indicator
          if (state.isLoading)
            const Center(child: CircularProgressIndicator())
          else if (state.summary != null) ...[
            // Summary cards
            _buildSummarySection(state),
            const SizedBox(height: 24),

            // Activity distribution charts
            if (state.activityBreakdown.isNotEmpty)
              LayoutBuilder(
                builder: (context, constraints) {
                  if (constraints.maxWidth > 800) {
                    // Side by side on wide screens
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: ActivityDistributionChart.fromBreakdowns(
                            breakdowns: state.activityBreakdown,
                            title: 'Actividades por Tipo',
                            currencySymbol: ref.watch(currencySymbolProvider),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ActivityDistributionChart.fromBreakdowns(
                            breakdowns: state.activityBreakdown,
                            title: 'Gastos por Tipo',
                            showExpenses: true,
                            currencySymbol: ref.watch(currencySymbolProvider),
                          ),
                        ),
                      ],
                    );
                  }
                  // Stacked on narrow screens
                  return Column(
                    children: [
                      ActivityDistributionChart.fromBreakdowns(
                        breakdowns: state.activityBreakdown,
                        title: 'Actividades por Tipo',
                        currencySymbol: ref.watch(currencySymbolProvider),
                      ),
                      const SizedBox(height: 16),
                      ActivityDistributionChart.fromBreakdowns(
                        breakdowns: state.activityBreakdown,
                        title: 'Gastos por Tipo',
                        showExpenses: true,
                        currencySymbol: ref.watch(currencySymbolProvider),
                      ),
                    ],
                  );
                },
              ),
            if (state.activityBreakdown.isNotEmpty) const SizedBox(height: 24),

            // Hierarchy breakdown table
            if (state.summary!.hasHierarchyBreakdown)
              HierarchyBreakdownCard(
                breakdown: state.summary!.hierarchyBreakdown,
                currencySymbol: ref.watch(currencySymbolProvider),
                onEntityTap: (entityId) {
                  ref
                      .read(hierarchyReportsProvider.notifier)
                      .selectEntity(entityId);
                },
              ),

            // Users report table
            const SizedBox(height: 24),
            UsersReportTable(
              response: state.usersReport ?? UsersReportResponse.empty(),
              isLoading: state.isLoadingUsers,
              currentSort: state.usersSortBy,
              currentSortOrder: state.usersSortOrder,
              currentComplianceFilter: state.usersComplianceFilter,
              currencySymbol: ref.watch(currencySymbolProvider),
              onPageChange: (page) {
                ref.read(hierarchyReportsProvider.notifier).setUsersPage(page);
              },
              onUserTap: (userId, userName) {
                context.push(AppRoutes.userActivitiesPath(userId));
              },
              onSortChange: (sortBy, sortOrder) {
                ref
                    .read(hierarchyReportsProvider.notifier)
                    .sortUsers(sortBy, sortOrder);
              },
              onComplianceFilterChange: (filter) {
                ref
                    .read(hierarchyReportsProvider.notifier)
                    .filterUsersByCompliance(filter);
              },
              onSearchChange: (search) {
                ref.read(hierarchyReportsProvider.notifier).searchUsers(search);
              },
            ),
          ] else
            Center(
              child: Text(
                'Seleccione una entidad para ver los reportes',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPeriodSelector(HierarchyReportsState state) {
    final theme = Theme.of(context);

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
                    selectedType: state.periodType,
                    onTypeChanged: (type) {
                      ref
                          .read(hierarchyReportsProvider.notifier)
                          .setPeriodType(type);
                    },
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
                    periodType: state.periodType,
                    year: state.year,
                    periodIndex: state.periodIndex,
                    onPrevious: () {
                      ref
                          .read(hierarchyReportsProvider.notifier)
                          .previousPeriod();
                    },
                    onNext: () {
                      ref.read(hierarchyReportsProvider.notifier).nextPeriod();
                    },
                  ),
                ),
                const SizedBox(width: 16),
                ExportButton(
                  onExport: (format, reportType) =>
                      _handleExport(format, reportType, state),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: () {
                    ref.read(hierarchyReportsProvider.notifier).loadReports();
                  },
                  tooltip: 'Actualizar',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<ExportData> _handleExport(
    String format,
    String reportType,
    HierarchyReportsState state,
  ) async {
    if (format == 'pdf') {
      if (state.summary == null) {
        throw Exception('No hay datos para exportar');
      }

      final pdfService = PdfService();
      final authState = ref.read(authNotifierProvider);
      final requestorName = _resolveRequestorName(authState.user);
      final currencySymbol = ref.read(currencySymbolProvider);
      final now = DateTime.now();
      final dateStamp =
          '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';

      switch (reportType) {
        case 'activities':
          if (state.activityBreakdown.isEmpty) {
            throw Exception('No hay actividades para exportar');
          }
          final bytes = await pdfService.generateActivitiesBreakdownReport(
            breakdowns: state.activityBreakdown,
            summary: state.summary!,
            periodStart: state.periodStart,
            periodEnd: state.periodEnd,
            currencySymbol: currencySymbol,
            requestorName: requestorName,
          );
          return ExportData.fromBytes(
            bytes,
            'reporte_actividades_$dateStamp.pdf',
            'application/pdf',
          );
        case 'summary':
          final bytes = await pdfService.generateSummaryReport(
            summary: state.summary!,
            periodStart: state.periodStart,
            periodEnd: state.periodEnd,
            currencySymbol: currencySymbol,
            requestorName: requestorName,
          );
          return ExportData.fromBytes(
            bytes,
            'reporte_resumen_$dateStamp.pdf',
            'application/pdf',
          );
        case 'compliance':
          final compliance = state.compliance ?? ComplianceResponse.empty();
          final bytes = await pdfService.generateComplianceReport(
            compliance: compliance,
            entityName: state.summary!.entityName,
            periodStart: state.periodStart,
            periodEnd: state.periodEnd,
            requestorName: requestorName,
          );
          return ExportData.fromBytes(
            bytes,
            'reporte_cumplimiento_$dateStamp.pdf',
            'application/pdf',
          );
        default:
          throw Exception('Tipo de reporte no soportado');
      }
    }

    final reportsService = ref.read(reportsServiceProvider);

    final response = await reportsService.exportReport(
      format: format,
      reportType: reportType,
      entityId: state.selectedEntityId,
      dateFrom: _formatDateForApi(state.periodStart),
      dateTo: _formatDateForApi(state.periodEnd),
    );

    return ExportData.fromString(
      response.data,
      response.filename,
      response.contentType,
    );
  }

  String? _resolveRequestorName(Map<String, dynamic>? user) {
    if (user == null) return null;
    return user['full_name'] as String? ??
        user['first_name'] as String? ??
        user['name'] as String? ??
        user['nickname'] as String? ??
        user['username'] as String? ??
        user['email'] as String?;
  }

  String _formatDateForApi(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  Widget _buildSummarySection(HierarchyReportsState state) {
    final summary = state.summary!;
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.analytics, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Resumen: ${summary.entityName}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                _StatCard(
                  label: 'Actividades',
                  value: '${summary.totalActivities}',
                  icon: Icons.assignment,
                ),
                _StatCard(
                  label: 'Gastos',
                  value: CurrencyFormatter.format(
                      summary.totalExpenses, ref.watch(currencySymbolProvider)),
                  icon: Icons.attach_money,
                ),
                _StatCard(
                  label: 'Cumplimiento',
                  value: '${summary.compliancePercent.toStringAsFixed(0)}%',
                  icon: Icons.check_circle,
                  color: summary.complianceRate >= 0.8
                      ? Colors.green
                      : summary.complianceRate >= 0.5
                          ? Colors.orange
                          : Colors.red,
                ),
                _StatCard(
                  label: 'Usuarios',
                  value: '${summary.usersSubmitted}/${summary.usersExpected}',
                  icon: Icons.people,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMobileLayout(HierarchyReportsState state) {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          const TabBar(
            tabs: [
              Tab(text: 'Reportes', icon: Icon(Icons.analytics)),
              Tab(text: 'Jerarquía', icon: Icon(Icons.account_tree)),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                _buildContent(state),
                _buildSidebar(state),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cardColor = color ?? theme.colorScheme.primary;

    return Container(
      width: 160,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cardColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: cardColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: cardColor),
              const SizedBox(width: 4),
              Text(
                label,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: cardColor,
            ),
          ),
        ],
      ),
    );
  }
}

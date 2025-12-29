import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/entity_hierarchy.dart';
import '../models/hierarchy_breakdown.dart';
import '../models/compliance_report.dart';
import '../models/users_report.dart';
import '../models/report_period_type.dart';
import '../models/report_breakdown.dart';
import '../services/entity_service.dart';
import '../services/reports_service.dart';
import 'auth.dart';

/// State for hierarchy reports feature
class HierarchyReportsState {
  final bool isLoading;
  final EntityTreeNode? hierarchyTree;
  final String? selectedEntityId;
  final List<EntityInfo> navigationPath;
  final HierarchySummaryResponse? summary;
  final ComplianceResponse? compliance;
  final UsersReportResponse? usersReport;
  final List<ReportBreakdown> activityBreakdown;
  final bool isLoadingUsers;
  final int usersPage;
  final String? usersSearch;
  final ComplianceFilter usersComplianceFilter;
  final String? usersSortBy;
  final String? usersSortOrder;
  final String? error;
  final ReportPeriodType periodType;
  final int year;
  final int periodIndex;
  final DateTime periodStart;
  final DateTime periodEnd;

  const HierarchyReportsState({
    required this.isLoading,
    this.hierarchyTree,
    this.selectedEntityId,
    required this.navigationPath,
    this.summary,
    this.compliance,
    this.usersReport,
    this.activityBreakdown = const [],
    this.isLoadingUsers = false,
    this.usersPage = 1,
    this.usersSearch,
    this.usersComplianceFilter = ComplianceFilter.all,
    this.usersSortBy,
    this.usersSortOrder,
    this.error,
    required this.periodType,
    required this.year,
    required this.periodIndex,
    required this.periodStart,
    required this.periodEnd,
  });

  factory HierarchyReportsState.initial() {
    final now = DateTime.now();
    const periodType = ReportPeriodType.monthly;
    final year = now.year;
    final periodIndex = now.month;
    final bounds = _calculatePeriodBounds(periodType, year, periodIndex);

    return HierarchyReportsState(
      isLoading: false,
      hierarchyTree: null,
      selectedEntityId: null,
      navigationPath: const [],
      summary: null,
      compliance: null,
      usersReport: null,
      activityBreakdown: const [],
      isLoadingUsers: false,
      usersPage: 1,
      usersSearch: null,
      usersComplianceFilter: ComplianceFilter.all,
      usersSortBy: null,
      usersSortOrder: null,
      error: null,
      periodType: periodType,
      year: year,
      periodIndex: periodIndex,
      periodStart: bounds['start']!,
      periodEnd: bounds['end']!,
    );
  }

  /// Calculate period bounds from type, year, and index
  static Map<String, DateTime> _calculatePeriodBounds(
    ReportPeriodType periodType,
    int year,
    int periodIndex,
  ) {
    DateTime start;
    DateTime end;

    switch (periodType) {
      case ReportPeriodType.monthly:
        start = DateTime(year, periodIndex, 1);
        end = DateTime(year, periodIndex + 1, 0, 23, 59, 59);
        break;
      case ReportPeriodType.quarterly:
        final startMonth = (periodIndex - 1) * 3 + 1;
        start = DateTime(year, startMonth, 1);
        end = DateTime(year, startMonth + 3, 0, 23, 59, 59);
        break;
      case ReportPeriodType.biannual:
        final startMonth = (periodIndex - 1) * 6 + 1;
        start = DateTime(year, startMonth, 1);
        end = DateTime(year, startMonth + 6, 0, 23, 59, 59);
        break;
      case ReportPeriodType.annual:
        start = DateTime(year, 1, 1);
        end = DateTime(year, 12, 31, 23, 59, 59);
        break;
    }

    return {'start': start, 'end': end};
  }

  HierarchyReportsState copyWith({
    bool? isLoading,
    EntityTreeNode? hierarchyTree,
    String? selectedEntityId,
    List<EntityInfo>? navigationPath,
    HierarchySummaryResponse? summary,
    ComplianceResponse? compliance,
    UsersReportResponse? usersReport,
    List<ReportBreakdown>? activityBreakdown,
    bool? isLoadingUsers,
    int? usersPage,
    String? usersSearch,
    ComplianceFilter? usersComplianceFilter,
    String? usersSortBy,
    String? usersSortOrder,
    String? error,
    ReportPeriodType? periodType,
    int? year,
    int? periodIndex,
    DateTime? periodStart,
    DateTime? periodEnd,
  }) {
    return HierarchyReportsState(
      isLoading: isLoading ?? this.isLoading,
      hierarchyTree: hierarchyTree ?? this.hierarchyTree,
      selectedEntityId: selectedEntityId ?? this.selectedEntityId,
      navigationPath: navigationPath ?? this.navigationPath,
      summary: summary ?? this.summary,
      compliance: compliance ?? this.compliance,
      usersReport: usersReport ?? this.usersReport,
      activityBreakdown: activityBreakdown ?? this.activityBreakdown,
      isLoadingUsers: isLoadingUsers ?? this.isLoadingUsers,
      usersPage: usersPage ?? this.usersPage,
      usersSearch: usersSearch ?? this.usersSearch,
      usersComplianceFilter:
          usersComplianceFilter ?? this.usersComplianceFilter,
      usersSortBy: usersSortBy ?? this.usersSortBy,
      usersSortOrder: usersSortOrder ?? this.usersSortOrder,
      error: error,
      periodType: periodType ?? this.periodType,
      year: year ?? this.year,
      periodIndex: periodIndex ?? this.periodIndex,
      periodStart: periodStart ?? this.periodStart,
      periodEnd: periodEnd ?? this.periodEnd,
    );
  }

  /// Returns true if the user has selected a specific entity
  bool get hasSelectedEntity => selectedEntityId != null;

  /// Returns true if hierarchy data has been loaded
  bool get hasHierarchy => hierarchyTree != null;

  /// Returns true if summary data has been loaded
  bool get hasSummary => summary != null;
}

/// Notifier for managing hierarchy reports state
class HierarchyReportsNotifier extends StateNotifier<HierarchyReportsState> {
  HierarchyReportsNotifier({
    required this.entityService,
    required this.reportsService,
  }) : super(HierarchyReportsState.initial());

  final EntityService entityService;
  final ReportsService reportsService;

  /// Timer for debouncing period navigation
  Timer? _debounceTimer;

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  /// Load all reports in parallel for better performance
  Future<void> _loadAllReportsParallel() async {
    if (state.selectedEntityId == null) return;

    state = state.copyWith(isLoading: true, isLoadingUsers: true, error: null);

    try {
      // Run all four report types in parallel
      final results = await Future.wait([
        reportsService.getHierarchySummary(
          entityId: state.selectedEntityId,
          periodStart: _formatDate(state.periodStart),
          periodEnd: _formatDate(state.periodEnd),
          includeHierarchyBreakdown: true,
        ),
        reportsService.getCompliance(
          entityId: state.selectedEntityId,
          dateFrom: _formatDate(state.periodStart),
          dateTo: _formatDate(state.periodEnd),
        ),
        reportsService.getUsersReport(
          entityId: state.selectedEntityId,
          dateFrom: _formatDate(state.periodStart),
          dateTo: _formatDate(state.periodEnd),
          page: 1,
          limit: 20,
          search: null,
          compliance: ComplianceFilter.all,
          sortBy: null,
          sortOrder: null,
        ),
        reportsService.getEntityBreakdown(
          entityId: state.selectedEntityId,
          periodStart: _formatDate(state.periodStart),
          periodEnd: _formatDate(state.periodEnd),
        ),
      ]);

      state = state.copyWith(
        isLoading: false,
        isLoadingUsers: false,
        summary: results[0] as HierarchySummaryResponse,
        compliance: results[1] as ComplianceResponse,
        usersReport: results[2] as UsersReportResponse,
        activityBreakdown: results[3] as List<ReportBreakdown>,
        usersPage: 1,
        usersSearch: null,
        usersComplianceFilter: ComplianceFilter.all,
        usersSortBy: null,
        usersSortOrder: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isLoadingUsers: false,
        error: 'Error al cargar reportes: $e',
      );
    }
  }

  /// Load the hierarchy tree for the given entity
  Future<void> loadHierarchy(String entityId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final tree = await entityService.getHierarchyTree(entityId);
      if (tree != null) {
        state = state.copyWith(
          isLoading: false,
          hierarchyTree: tree,
          selectedEntityId: entityId,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: 'No se pudo cargar la jerarquía',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar la jerarquía: $e',
      );
    }
  }

  /// Select an entity and load its reports
  Future<void> selectEntity(String entityId) async {
    state = state.copyWith(selectedEntityId: entityId);
    await _loadAllReportsParallel();
  }

  /// Load reports for the currently selected entity
  Future<void> loadReports() async {
    await _loadAllReportsParallel();
  }

  /// Update the period and reload reports (legacy method for date picker)
  Future<void> setPeriod(DateTime start, DateTime end) async {
    state = state.copyWith(periodStart: start, periodEnd: end);
    await _loadAllReportsParallel();
  }

  /// Change period type and reset to current period
  Future<void> setPeriodType(ReportPeriodType type) async {
    final now = DateTime.now();
    int newPeriodIndex;

    switch (type) {
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

    final bounds = HierarchyReportsState._calculatePeriodBounds(
      type,
      now.year,
      newPeriodIndex,
    );

    state = state.copyWith(
      periodType: type,
      year: now.year,
      periodIndex: newPeriodIndex,
      periodStart: bounds['start'],
      periodEnd: bounds['end'],
    );

    await _loadAllReportsParallel();
  }

  /// Go to previous period (debounced for rapid navigation)
  Future<void> previousPeriod() async {
    int newYear = state.year;
    int newPeriodIndex = state.periodIndex;

    if (newPeriodIndex > 1) {
      newPeriodIndex--;
    } else {
      newYear--;
      newPeriodIndex = state.periodType.maxPeriodIndex;
    }

    final bounds = HierarchyReportsState._calculatePeriodBounds(
      state.periodType,
      newYear,
      newPeriodIndex,
    );

    // Update state immediately for responsive UI
    state = state.copyWith(
      year: newYear,
      periodIndex: newPeriodIndex,
      periodStart: bounds['start'],
      periodEnd: bounds['end'],
    );

    // Debounce the API call
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      _loadAllReportsParallel();
    });
  }

  /// Go to next period (debounced for rapid navigation)
  Future<void> nextPeriod() async {
    int newYear = state.year;
    int newPeriodIndex = state.periodIndex;

    if (newPeriodIndex < state.periodType.maxPeriodIndex) {
      newPeriodIndex++;
    } else {
      newYear++;
      newPeriodIndex = 1;
    }

    final bounds = HierarchyReportsState._calculatePeriodBounds(
      state.periodType,
      newYear,
      newPeriodIndex,
    );

    // Update state immediately for responsive UI
    state = state.copyWith(
      year: newYear,
      periodIndex: newPeriodIndex,
      periodStart: bounds['start'],
      periodEnd: bounds['end'],
    );

    // Debounce the API call
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      _loadAllReportsParallel();
    });
  }

  /// Load users report with current filters
  Future<void> loadUsersReport({
    int? page,
    String? search,
    ComplianceFilter? complianceFilter,
    String? sortBy,
    String? sortOrder,
  }) async {
    if (state.selectedEntityId == null) return;

    state = state.copyWith(
      isLoadingUsers: true,
      usersPage: page ?? state.usersPage,
      usersSearch: search ?? state.usersSearch,
      usersComplianceFilter: complianceFilter ?? state.usersComplianceFilter,
      usersSortBy: sortBy ?? state.usersSortBy,
      usersSortOrder: sortOrder ?? state.usersSortOrder,
    );

    try {
      final usersReport = await reportsService.getUsersReport(
        entityId: state.selectedEntityId,
        dateFrom: _formatDate(state.periodStart),
        dateTo: _formatDate(state.periodEnd),
        page: state.usersPage,
        limit: 20,
        search: state.usersSearch,
        compliance: state.usersComplianceFilter,
        sortBy: state.usersSortBy,
        sortOrder: state.usersSortOrder,
      );

      state = state.copyWith(
        isLoadingUsers: false,
        usersReport: usersReport,
      );
    } catch (e) {
      state = state.copyWith(
        isLoadingUsers: false,
        error: 'Error al cargar usuarios: $e',
      );
    }
  }

  /// Change users report page
  Future<void> setUsersPage(int page) async {
    await loadUsersReport(page: page);
  }

  /// Search users
  Future<void> searchUsers(String search) async {
    await loadUsersReport(page: 1, search: search);
  }

  /// Filter users by compliance
  Future<void> filterUsersByCompliance(ComplianceFilter filter) async {
    await loadUsersReport(page: 1, complianceFilter: filter);
  }

  /// Sort users
  Future<void> sortUsers(String sortBy, String sortOrder) async {
    await loadUsersReport(page: 1, sortBy: sortBy, sortOrder: sortOrder);
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

/// Provider that creates an access token getter function from auth state
final accessTokenGetterProvider = Provider<Future<String> Function()>((ref) {
  final authNotifier = ref.watch(authNotifierProvider.notifier);
  return () async {
    final token = await authNotifier.getAccessToken();
    return token ?? '';
  };
});

/// Provider for entity service
final entityServiceProvider = Provider<EntityService>((ref) {
  final getAccessToken = ref.watch(accessTokenGetterProvider);
  return EntityService.localhost(getAccessToken);
});

/// Provider for hierarchy reports state
final hierarchyReportsProvider =
    StateNotifierProvider<HierarchyReportsNotifier, HierarchyReportsState>(
        (ref) {
  final entityService = ref.watch(entityServiceProvider);
  final reportsService = ref.watch(reportsServiceProvider);

  return HierarchyReportsNotifier(
    entityService: entityService,
    reportsService: reportsService,
  );
});

/// Provider for reports service (if not already defined elsewhere)
final reportsServiceProvider = Provider<ReportsService>((ref) {
  final getAccessToken = ref.watch(accessTokenGetterProvider);
  return ReportsService.localhost(getAccessToken);
});

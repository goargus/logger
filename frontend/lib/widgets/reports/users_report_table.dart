import 'package:flutter/material.dart';
import '../../models/users_report.dart';
import '../../utils/currency_formatter.dart';

class UsersReportTable extends StatefulWidget {
  const UsersReportTable({
    super.key,
    required this.response,
    required this.onPageChange,
    required this.onUserTap,
    this.onSortChange,
    this.onComplianceFilterChange,
    this.onSearchChange,
    this.currentSort,
    this.currentSortOrder,
    this.currentComplianceFilter,
    this.isLoading = false,
    this.currencySymbol = '\$',
  });

  final UsersReportResponse response;
  final void Function(int page) onPageChange;
  final void Function(String userId, String userName) onUserTap;
  final void Function(String sortBy, String sortOrder)? onSortChange;
  final void Function(ComplianceFilter filter)? onComplianceFilterChange;
  final void Function(String search)? onSearchChange;
  final String? currentSort;
  final String? currentSortOrder;
  final ComplianceFilter? currentComplianceFilter;
  final bool isLoading;
  final String currencySymbol;

  @override
  State<UsersReportTable> createState() => _UsersReportTableState();
}

class _UsersReportTableState extends State<UsersReportTable> {
  final _searchController = TextEditingController();
  String? _sortColumn;
  bool _sortAscending = true;

  @override
  void initState() {
    super.initState();
    _sortColumn = widget.currentSort;
    _sortAscending = widget.currentSortOrder != 'desc';
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _handleSort(String column) {
    setState(() {
      if (_sortColumn == column) {
        _sortAscending = !_sortAscending;
      } else {
        _sortColumn = column;
        _sortAscending = true;
      }
    });
    widget.onSortChange?.call(column, _sortAscending ? 'asc' : 'desc');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with title and controls
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.people, color: theme.colorScheme.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Reporte de Usuarios',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    _buildSummaryChips(theme),
                  ],
                ),
                const SizedBox(height: 16),
                _buildFilters(theme),
              ],
            ),
          ),
          const Divider(height: 1),

          // Table
          if (widget.isLoading)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (widget.response.isEmpty)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.people_outline,
                      size: 48,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'No hay usuarios para mostrar',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            _buildTable(theme),

          // Pagination
          if (!widget.response.isEmpty) _buildPagination(theme),
        ],
      ),
    );
  }

  Widget _buildSummaryChips(ThemeData theme) {
    final summary = widget.response.summary;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Chip(
          avatar: Icon(Icons.check, size: 16, color: Colors.green.shade700),
          label: Text('${summary.usersSubmitted}'),
          backgroundColor: Colors.green.shade50,
          visualDensity: VisualDensity.compact,
        ),
        const SizedBox(width: 8),
        Chip(
          avatar: Icon(Icons.close, size: 16, color: Colors.orange.shade700),
          label: Text('${summary.usersNotSubmitted}'),
          backgroundColor: Colors.orange.shade50,
          visualDensity: VisualDensity.compact,
        ),
      ],
    );
  }

  Widget _buildFilters(ThemeData theme) {
    return Row(
      children: [
        // Search
        Expanded(
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Buscar por nombre o email...',
              prefixIcon: const Icon(Icons.search),
              border: const OutlineInputBorder(),
              isDense: true,
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        widget.onSearchChange?.call('');
                      },
                    )
                  : null,
            ),
            onSubmitted: widget.onSearchChange,
          ),
        ),
        const SizedBox(width: 16),

        // Compliance filter
        DropdownButton<ComplianceFilter>(
          value: widget.currentComplianceFilter ?? ComplianceFilter.all,
          items: ComplianceFilter.values.map((filter) {
            return DropdownMenuItem(
              value: filter,
              child: Text(filter.label),
            );
          }).toList(),
          onChanged: (value) {
            if (value != null) {
              widget.onComplianceFilterChange?.call(value);
            }
          },
        ),
      ],
    );
  }

  Widget _buildTable(ThemeData theme) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        sortColumnIndex: _getSortColumnIndex(),
        sortAscending: _sortAscending,
        headingRowColor: WidgetStateProperty.all(
          theme.colorScheme.surfaceContainerHighest,
        ),
        columns: [
          DataColumn(
            label: const Text('Usuario'),
            onSort: (_, __) => _handleSort('name'),
          ),
          DataColumn(
            label: const Text('Email'),
            onSort: (_, __) => _handleSort('email'),
          ),
          DataColumn(
            label: const Text('Entidad'),
            onSort: (_, __) => _handleSort('entity'),
          ),
          DataColumn(
            label: const Text('Rol'),
            onSort: (_, __) => _handleSort('role'),
          ),
          const DataColumn(
            label: Text('Actividades'),
            numeric: true,
          ),
          const DataColumn(
            label: Text('Gastos'),
            numeric: true,
          ),
          const DataColumn(
            label: Text('Ultima Actividad'),
          ),
          const DataColumn(
            label: Text('Estado'),
          ),
        ],
        rows: widget.response.users.map((user) {
          return DataRow(
            cells: [
              DataCell(
                _buildUserCell(theme, user),
                onTap: () => widget.onUserTap(user.userId, user.name),
              ),
              DataCell(Text(user.email)),
              DataCell(Text(user.entityName)),
              DataCell(_buildRolesCell(theme, user)),
              DataCell(
                Text(
                  '${user.activitiesCount}',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: user.activitiesCount > 0
                        ? Colors.green.shade700
                        : Colors.grey,
                  ),
                ),
              ),
              DataCell(
                Text(
                  CurrencyFormatter.format(
                      user.totalExpenses, widget.currencySymbol),
                  style: theme.textTheme.bodyMedium,
                ),
              ),
              DataCell(
                Text(
                  _formatDate(user.lastActivityDate),
                  style: theme.textTheme.bodySmall,
                ),
              ),
              DataCell(_buildStatusChip(theme, user.hasSubmitted)),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildUserCell(ThemeData theme, UserReportItem user) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        CircleAvatar(
          radius: 14,
          backgroundColor: theme.colorScheme.primaryContainer,
          child: Text(
            user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
            style: TextStyle(
              color: theme.colorScheme.onPrimaryContainer,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          user.name,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
            color: theme.colorScheme.primary,
            decoration: TextDecoration.underline,
          ),
        ),
        const SizedBox(width: 4),
        Icon(
          Icons.open_in_new,
          size: 14,
          color: theme.colorScheme.primary,
        ),
      ],
    );
  }

  Widget _buildRolesCell(ThemeData theme, UserReportItem user) {
    final activeRoles = user.activeRoleAssignments;

    if (activeRoles.isEmpty) {
      return Text(user.roleName);
    }

    if (activeRoles.length == 1) {
      return Text(activeRoles.first.roleName);
    }

    // Multiple roles - show as chips with tooltip
    return Tooltip(
      message:
          activeRoles.map((r) => '${r.roleName} @ ${r.entityName}').join('\n'),
      child: Wrap(
        spacing: 4,
        runSpacing: 2,
        children: activeRoles.map((role) {
          return Chip(
            label: Text(
              role.roleName,
              style: const TextStyle(fontSize: 11),
            ),
            visualDensity: VisualDensity.compact,
            padding: EdgeInsets.zero,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          );
        }).toList(),
      ),
    );
  }

  Widget _buildStatusChip(ThemeData theme, bool hasSubmitted) {
    return Chip(
      label: Text(
        hasSubmitted ? 'Reportado' : 'Pendiente',
        style: TextStyle(
          fontSize: 12,
          color: hasSubmitted ? Colors.green.shade700 : Colors.orange.shade700,
        ),
      ),
      backgroundColor:
          hasSubmitted ? Colors.green.shade50 : Colors.orange.shade50,
      visualDensity: VisualDensity.compact,
      padding: EdgeInsets.zero,
    );
  }

  Widget _buildPagination(ThemeData theme) {
    final pagination = widget.response.pagination;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Mostrando ${((pagination.page - 1) * pagination.limit) + 1}-'
            '${_min(pagination.page * pagination.limit, pagination.total)} '
            'de ${pagination.total}',
            style: theme.textTheme.bodySmall,
          ),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.first_page),
                onPressed: pagination.hasPreviousPage
                    ? () => widget.onPageChange(1)
                    : null,
                tooltip: 'Primera pagina',
              ),
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: pagination.hasPreviousPage
                    ? () => widget.onPageChange(pagination.page - 1)
                    : null,
                tooltip: 'Pagina anterior',
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Pagina ${pagination.page} de ${pagination.totalPages}',
                  style: theme.textTheme.bodyMedium,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: pagination.hasNextPage
                    ? () => widget.onPageChange(pagination.page + 1)
                    : null,
                tooltip: 'Pagina siguiente',
              ),
              IconButton(
                icon: const Icon(Icons.last_page),
                onPressed: pagination.hasNextPage
                    ? () => widget.onPageChange(pagination.totalPages)
                    : null,
                tooltip: 'Ultima pagina',
              ),
            ],
          ),
        ],
      ),
    );
  }

  int? _getSortColumnIndex() {
    switch (_sortColumn) {
      case 'name':
        return 0;
      case 'email':
        return 1;
      case 'entity':
        return 2;
      case 'role':
        return 3;
      default:
        return null;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  int _min(int a, int b) => a < b ? a : b;
}

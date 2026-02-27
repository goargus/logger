import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/activities_filter.dart';
import '../../models/activity_type.dart';
import '../../providers/activities_list_provider.dart';
import '../../services/activity_type.dart';
import '../../config/api_config.dart';
import '../../core/api_client.dart';
import '../../providers/auth.dart';

class ActivityFilters extends ConsumerStatefulWidget {
  const ActivityFilters({super.key});

  @override
  ConsumerState<ActivityFilters> createState() => _ActivityFiltersState();
}

class _ActivityFiltersState extends ConsumerState<ActivityFilters> {
  TimePreset? _selectedPreset;
  String? _selectedActivityTypeId;
  bool? _hasExpenseFilter;
  DateTimeRange? _customDateRange;
  String? _searchQuery;

  List<ActivityType> _activityTypes = [];
  bool _loadingTypes = true;
  final TextEditingController _searchController = TextEditingController();
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    // Delay loading to ensure widget is fully mounted
    Future.microtask(() => _loadActivityTypes());
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadActivityTypes() async {
    if (!mounted) return;

    try {
      final authState = ref.read(authNotifierProvider);
      if (authState.accessToken == null) {
        // Auth not ready yet, try again later
        await Future.delayed(const Duration(milliseconds: 500));
        if (mounted) _loadActivityTypes();
        return;
      }

      final apiClient = ApiClient(
        baseUrl: ApiConfig.baseUrl,
        getAccessToken: () async => authState.accessToken ?? '',
      );
      final service = ActivityTypeService(apiClient: apiClient);
      final types = await service.fetchAll();
      if (mounted) {
        setState(() {
          _activityTypes = types;
          _loadingTypes = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading activity types: $e');
      if (mounted) {
        setState(() => _loadingTypes = false);
      }
    }
  }

  void _applyFilters() {
    DateTime? startDate;
    DateTime? endDate;
    final search = _searchQuery?.trim();

    if (_selectedPreset != null && _selectedPreset != TimePreset.custom) {
      final range = _selectedPreset!.getRange();
      startDate = range.start;
      endDate = range.end;
    } else if (_customDateRange != null) {
      startDate = _customDateRange!.start;
      endDate = _customDateRange!.end;
    }

    final filter = ActivitiesFilter(
      startDate: startDate,
      endDate: endDate,
      activityTypeId: _selectedActivityTypeId,
      hasExpense: _hasExpenseFilter,
      search: (search == null || search.isEmpty) ? null : search,
    );

    ref
        .read(activitiesListProvider.notifier)
        .setFilter(filter, preset: _selectedPreset);
  }

  Future<void> _showDateRangePicker() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2000),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDateRange: _customDateRange,
      locale: const Locale('es'),
      useRootNavigator: false,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            dialogTheme: const DialogThemeData(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.all(Radius.circular(16)),
              ),
            ),
          ),
          child: Dialog(
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 24,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  maxWidth: 400,
                  maxHeight: 700,
                ),
                child: child,
              ),
            ),
          ),
        );
      },
    );
    if (picked != null) {
      setState(() {
        _customDateRange = picked;
        _selectedPreset = TimePreset.custom;
      });
      _applyFilters();
    }
  }

  void _clearFilters() {
    setState(() {
      _selectedPreset = null;
      _selectedActivityTypeId = null;
      _hasExpenseFilter = null;
      _customDateRange = null;
      _searchQuery = null;
    });
    _searchDebounce?.cancel();
    _searchController.clear();
    ref
        .read(activitiesListProvider.notifier)
        .setFilter(const ActivitiesFilter());
  }

  void _onSearchChanged(String value) {
    setState(() => _searchQuery = value);
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 400), _applyFilters);
  }

  @override
  Widget build(BuildContext context) {
    final hasActiveFilters = _selectedPreset != null ||
        _selectedActivityTypeId != null ||
        _hasExpenseFilter != null ||
        (_searchQuery != null && _searchQuery!.trim().isNotEmpty);

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Filtros',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                if (hasActiveFilters)
                  TextButton.icon(
                    onPressed: _clearFilters,
                    icon: const Icon(Icons.clear, size: 16),
                    label: const Text('Limpiar'),
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.grey.shade600,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            TextField(
              controller: _searchController,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                labelText: 'Buscar',
                hintText: 'Descripcion o tipo de actividad',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: (_searchQuery != null && _searchQuery!.isNotEmpty)
                    ? IconButton(
                        icon: const Icon(Icons.close),
                        tooltip: 'Limpiar busqueda',
                        onPressed: () {
                          _searchDebounce?.cancel();
                          _searchController.clear();
                          setState(() => _searchQuery = null);
                          _applyFilters();
                        },
                      )
                    : null,
                border: const OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: _onSearchChanged,
            ),
            const SizedBox(height: 16),

            // Time presets row
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: TimePreset.values.map((preset) {
                final isSelected = _selectedPreset == preset;
                return ChoiceChip(
                  label: Text(preset.label),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      _selectedPreset = selected ? preset : null;
                    });
                    if (preset == TimePreset.custom && selected) {
                      _showDateRangePicker();
                    } else if (selected) {
                      _applyFilters();
                    } else {
                      _applyFilters();
                    }
                  },
                );
              }).toList(),
            ),

            if (_selectedPreset == TimePreset.custom &&
                _customDateRange != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '${_formatDate(_customDateRange!.start)} - ${_formatDate(_customDateRange!.end)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                ),
              ),

            const SizedBox(height: 16),

            // Additional filters row
            Row(
              children: [
                // Activity type dropdown
                Expanded(
                  child: _loadingTypes
                      ? InputDecorator(
                          decoration: const InputDecoration(
                            labelText: 'Tipo de Actividad',
                            border: OutlineInputBorder(),
                            isDense: true,
                            contentPadding: EdgeInsets.symmetric(
                                horizontal: 12, vertical: 12),
                          ),
                          child: Row(
                            children: [
                              const SizedBox(
                                width: 16,
                                height: 16,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Cargando...',
                                style: TextStyle(color: Colors.grey.shade600),
                              ),
                            ],
                          ),
                        )
                      : DropdownButtonFormField<String?>(
                          key: ValueKey('type_$_selectedActivityTypeId'),
                          initialValue: _selectedActivityTypeId,
                          decoration: const InputDecoration(
                            labelText: 'Tipo de Actividad',
                            border: OutlineInputBorder(),
                            isDense: true,
                            contentPadding: EdgeInsets.symmetric(
                                horizontal: 12, vertical: 12),
                          ),
                          items: [
                            const DropdownMenuItem(
                                value: null, child: Text('Todos los tipos')),
                            ..._activityTypes.map((t) => DropdownMenuItem(
                                  value: t.id,
                                  child: Text(t.name),
                                )),
                          ],
                          onChanged: (value) {
                            setState(() => _selectedActivityTypeId = value);
                            _applyFilters();
                          },
                        ),
                ),
                const SizedBox(width: 16),

                // Expense filter dropdown
                Expanded(
                  child: DropdownButtonFormField<bool?>(
                    key: ValueKey('expense_$_hasExpenseFilter'),
                    initialValue: _hasExpenseFilter,
                    decoration: const InputDecoration(
                      labelText: 'Gastos',
                      border: OutlineInputBorder(),
                      isDense: true,
                      contentPadding:
                          EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('Todos')),
                      DropdownMenuItem(value: true, child: Text('Con gasto')),
                      DropdownMenuItem(value: false, child: Text('Sin gasto')),
                    ],
                    onChanged: (value) {
                      setState(() => _hasExpenseFilter = value);
                      _applyFilters();
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
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
      'Dic'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }
}

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/reporting_periods.dart';

class CalendarDialog extends StatefulWidget {
  final DateTime initialDate;
  final DateTime firstDate;
  final DateTime lastDate;
  final ReportingPeriodsService reportingPeriodsService;

  const CalendarDialog({
    super.key,
    required this.initialDate,
    required this.firstDate,
    required this.lastDate,
    required this.reportingPeriodsService,
  });

  @override
  State<CalendarDialog> createState() => _CalendarDialogState();
}

class _CalendarDialogState extends State<CalendarDialog> {
  late DateTime _focusedMonth;
  DateTime? _selected;
  List<LockedDateRange> _lockedRanges = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _focusedMonth = DateTime(widget.initialDate.year, widget.initialDate.month);
    _selected = widget.initialDate;
    _loadLockedDateRanges();
  }

  Future<void> _loadLockedDateRanges() async {
    try {
      final ranges = await widget.reportingPeriodsService.getLockedDateRanges();
      if (mounted) {
        setState(() {
          _lockedRanges = ranges;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error al cargar restricciones de fechas';
          _isLoading = false;
          _lockedRanges = [];
        });
      }
    }
  }

  bool _isDateSelectable(DateTime date) {
    if (_isLoading) {
      return false;
    }

    if (_errorMessage != null) {
      return true;
    }

    for (final range in _lockedRanges) {
      if (range.containsDateTime(date)) {
        return false;
      }
    }
    return true;
  }

  void _prevMonth() {
    setState(() {
      _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month - 1);
    });
  }

  void _nextMonth() {
    setState(() {
      _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month + 1);
    });
  }

  @override
  Widget build(BuildContext context) {
    final year = _focusedMonth.year;
    final monthLabel = DateFormat.MMMM('es_ES').format(_focusedMonth);
    final today =
        DateFormat('d \'de\' MMMM, y', 'es_ES').format(DateTime.now());

    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Text('$year',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      )),
                ),
                const Spacer(),
                IconButton(
                  tooltip: 'Mes anterior',
                  onPressed: _prevMonth,
                  icon: const Icon(Icons.chevron_left),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Text(
                    _capitalize(monthLabel),
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Mes siguiente',
                  onPressed: _nextMonth,
                  icon: const Icon(Icons.chevron_right),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Container(
                    height: 44,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Theme.of(context).dividerColor),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    alignment: Alignment.centerLeft,
                    child: Text(
                      _isLoading
                          ? 'Cargando restricciones...'
                          : _errorMessage != null
                              ? 'Sin restricciones'
                              : _lockedRanges.isEmpty
                                  ? 'Todas las fechas disponibles'
                                  : '${_lockedRanges.length} período(s) bloqueado(s)',
                      style: TextStyle(
                        color: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.color
                            ?.withValues(alpha: 0.7),
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: _lockedRanges.isNotEmpty
                        ? Theme.of(context).colorScheme.errorContainer
                        : Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Icon(
                    _lockedRanges.isNotEmpty
                        ? Icons.lock_outline
                        : Icons.filter_list,
                    color: _lockedRanges.isNotEmpty
                        ? Theme.of(context).colorScheme.error
                        : Theme.of(context).colorScheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_isLoading)
              Container(
                height: 340,
                alignment: Alignment.center,
                child: const CircularProgressIndicator(),
              )
            else if (_errorMessage != null)
              Container(
                height: 340,
                alignment: Alignment.center,
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline,
                        size: 48, color: Theme.of(context).colorScheme.error),
                    const SizedBox(height: 16),
                    Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ],
                ),
              )
            else
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                child: CalendarDatePicker(
                  initialDate: _selected ?? widget.initialDate,
                  firstDate: widget.firstDate,
                  lastDate: widget.lastDate,
                  currentDate: DateTime.now(),
                  onDateChanged: (d) => setState(() => _selected = d),
                  initialCalendarMode: DatePickerMode.day,
                  selectableDayPredicate: _isDateSelectable,
                ),
              ),
            const SizedBox(height: 12),
            if (_lockedRanges.isNotEmpty) ...[
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: Theme.of(context)
                        .colorScheme
                        .error
                        .withValues(alpha: 0.3),
                  ),
                ),
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.lock_outline,
                          size: 16,
                          color: Theme.of(context).colorScheme.error,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Períodos bloqueados:',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ..._lockedRanges.map((range) {
                      final start = DateFormat('d MMM', 'es_ES')
                          .format(DateTime.parse(range.startDate));
                      final end = DateFormat('d MMM yyyy', 'es_ES')
                          .format(DateTime.parse(range.endDate));
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          '• $start - $end: ${range.periodName}',
                          style: TextStyle(
                            fontSize: 11,
                            color:
                                Theme.of(context).colorScheme.onErrorContainer,
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.today, size: 16, color: Colors.white),
                  const SizedBox(width: 8),
                  Text('Hoy: $today',
                      style: const TextStyle(color: Colors.white)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancelar'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton(
                    onPressed: _selected == null
                        ? null
                        : () => Navigator.of(context).pop(_selected),
                    child: const Text('Seleccionar'),
                  ),
                ),
              ],
            )
          ]),
        ),
      ),
    );
  }

  String _capitalize(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
}

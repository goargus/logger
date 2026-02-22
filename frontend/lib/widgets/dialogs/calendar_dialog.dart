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
  ReportingPeriodSummary? _activePeriod;
  bool _isLoading = true;
  String? _errorMessage;
  String? _periodErrorMessage;

  @override
  void initState() {
    super.initState();
    _focusedMonth = DateTime(widget.initialDate.year, widget.initialDate.month);
    _selected = widget.initialDate;
    _loadReportingContext();
  }

  Future<void> _loadReportingContext() async {
    String? lockedError;
    String? periodError;
    List<LockedDateRange> ranges = [];
    ReportingPeriodSummary? activePeriod;

    try {
      ranges = await widget.reportingPeriodsService.getLockedDateRanges();
    } catch (e) {
      lockedError = 'Error al cargar restricciones de fechas';
    }

    try {
      activePeriod =
          await widget.reportingPeriodsService.getActiveReportingPeriod();
    } catch (e) {
      periodError = 'No se pudo cargar el período activo';
    }

    if (!mounted) return;

    setState(() {
      _lockedRanges = ranges;
      _activePeriod = activePeriod;
      _errorMessage = lockedError;
      _periodErrorMessage =
          periodError ?? (activePeriod == null ? 'Sin período activo' : null);
      _isLoading = false;

      if (_selected != null) {
        if (_lockedRanges.any((range) => range.containsDateTime(_selected!)) ||
            !_isWithinActivePeriod(_selected!)) {
          _selected = null;
        }
      }
    });
  }

  bool _isWithinSelectableRange(DateTime date) {
    final day = DateTime(date.year, date.month, date.day);
    final first = DateTime(
        widget.firstDate.year, widget.firstDate.month, widget.firstDate.day);
    final last = DateTime(
        widget.lastDate.year, widget.lastDate.month, widget.lastDate.day);
    return !day.isBefore(first) && !day.isAfter(last);
  }

  bool _isWithinActivePeriod(DateTime date) {
    if (_activePeriod == null) {
      return false;
    }
    return _activePeriod!.containsDateTime(date);
  }

  LockedDateRange? _lockedRangeForDate(DateTime date) {
    if (_activePeriod != null && _activePeriod!.containsDateTime(date)) {
      return null;
    }
    for (final range in _lockedRanges) {
      if (range.containsDateTime(date)) {
        return range;
      }
    }
    return null;
  }

  void _showLockedDateFeedback() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Esta fecha pertenece a un periodo bloqueado'),
      ),
    );
  }

  void _showOutOfPeriodFeedback() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Esta fecha está fuera del período activo'),
      ),
    );
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
    final localizations = MaterialLocalizations.of(context);
    final visibleLockedRanges =
        _lockedRanges.where((range) => !_overlapsActivePeriod(range)).toList();

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
                          : (_errorMessage != null ||
                                  _periodErrorMessage != null)
                              ? 'Restricciones con advertencias'
                              : _activePeriod != null
                                  ? 'Período activo: ${_formatActivePeriod()}'
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
                    color:
                        (_errorMessage != null || _periodErrorMessage != null)
                            ? Theme.of(context)
                                .colorScheme
                                .errorContainer
                                .withValues(alpha: 0.6)
                            : _lockedRanges.isNotEmpty
                                ? Theme.of(context).colorScheme.errorContainer
                                : Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Icon(
                    (_errorMessage != null || _periodErrorMessage != null)
                        ? Icons.warning_amber_outlined
                        : _lockedRanges.isNotEmpty
                            ? Icons.lock_outline
                            : Icons.filter_list,
                    color:
                        (_errorMessage != null || _periodErrorMessage != null)
                            ? Theme.of(context).colorScheme.error
                            : _lockedRanges.isNotEmpty
                                ? Theme.of(context).colorScheme.error
                                : Theme.of(context).colorScheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_errorMessage != null || _periodErrorMessage != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Theme.of(context)
                      .colorScheme
                      .errorContainer
                      .withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: Theme.of(context)
                        .colorScheme
                        .error
                        .withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.warning_amber_outlined,
                      size: 18,
                      color: Theme.of(context).colorScheme.error,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage != null && _periodErrorMessage != null
                            ? 'No se pudieron cargar restricciones ni el período activo.'
                            : _errorMessage != null
                                ? 'No se pudieron cargar los períodos bloqueados. Algunas fechas podrían estar bloqueadas.'
                                : _periodErrorMessage == 'Sin período activo'
                                    ? 'No se encontró un período activo. Algunas fechas podrían no estar disponibles.'
                                    : 'No se pudo cargar el período activo. Algunas fechas podrían no estar disponibles.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            if (_errorMessage != null) const SizedBox(height: 12),
            if (_isLoading)
              Container(
                height: 340,
                alignment: Alignment.center,
                child: const CircularProgressIndicator(),
              )
            else
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.fromLTRB(8, 8, 8, 12),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: _orderedWeekdays(localizations)
                          .map((label) => Expanded(
                                child: Center(
                                  child: Text(
                                    label,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.color
                                          ?.withValues(alpha: 0.7),
                                    ),
                                  ),
                                ),
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 6),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 7,
                        mainAxisSpacing: 4,
                        crossAxisSpacing: 4,
                        childAspectRatio: 1.2,
                      ),
                      itemCount: _daysInGrid(localizations),
                      itemBuilder: (context, index) {
                        final day = _dateForIndex(index, localizations);
                        if (day == null) {
                          return const SizedBox.shrink();
                        }
                        final isToday =
                            DateUtils.isSameDay(day, DateTime.now());
                        final isSelected = _selected != null &&
                            DateUtils.isSameDay(day, _selected);
                        final isWithinRange = _isWithinSelectableRange(day);
                        final isWithinActivePeriod = _isWithinActivePeriod(day);
                        final lockedRange = _lockedRangeForDate(day);
                        final isLocked = lockedRange != null;
                        final isOutOfPeriod = !isWithinActivePeriod;
                        final isTappable = isWithinRange;

                        return _DayCell(
                          date: day,
                          isToday: isToday,
                          isSelected: isSelected,
                          isLocked: isLocked,
                          isOutOfPeriod: isOutOfPeriod,
                          isDisabled: !isWithinRange,
                          isTappable: isTappable,
                          onTap: () {
                            if (!isWithinRange) {
                              return;
                            }
                            if (isLocked) {
                              _showLockedDateFeedback();
                              return;
                            }
                            if (isOutOfPeriod) {
                              _showOutOfPeriodFeedback();
                              return;
                            }
                            setState(() => _selected = day);
                          },
                        );
                      },
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 12),
            if (visibleLockedRanges.isNotEmpty) ...[
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
                    ...visibleLockedRanges.map((range) {
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

  bool _overlapsActivePeriod(LockedDateRange range) {
    if (_activePeriod == null) {
      return false;
    }
    try {
      final activeStart = DateTime.parse(_activePeriod!.startDate);
      final activeEnd = DateTime.parse(_activePeriod!.endDate);
      final lockedStart = DateTime.parse(range.startDate);
      final lockedEnd = DateTime.parse(range.endDate);
      return !(lockedEnd.isBefore(activeStart) ||
          lockedStart.isAfter(activeEnd));
    } catch (e) {
      return false;
    }
  }

  String _formatActivePeriod() {
    final period = _activePeriod;
    if (period == null) {
      return '';
    }
    try {
      final start =
          DateFormat('d MMM', 'es_ES').format(DateTime.parse(period.startDate));
      final end = DateFormat('d MMM yyyy', 'es_ES')
          .format(DateTime.parse(period.endDate));
      return '$start - $end';
    } catch (e) {
      return period.label;
    }
  }

  List<String> _orderedWeekdays(MaterialLocalizations localizations) {
    final labels = localizations.narrowWeekdays;
    final firstDay = localizations.firstDayOfWeekIndex;
    return [
      ...labels.sublist(firstDay),
      ...labels.sublist(0, firstDay),
    ];
  }

  int _daysInGrid(MaterialLocalizations localizations) {
    final year = _focusedMonth.year;
    final month = _focusedMonth.month;
    final daysInMonth = DateUtils.getDaysInMonth(year, month);
    final offset = DateUtils.firstDayOffset(year, month, localizations);
    final total = daysInMonth + offset;
    return ((total + 6) ~/ 7) * 7;
  }

  DateTime? _dateForIndex(int index, MaterialLocalizations localizations) {
    final year = _focusedMonth.year;
    final month = _focusedMonth.month;
    final daysInMonth = DateUtils.getDaysInMonth(year, month);
    final offset = DateUtils.firstDayOffset(year, month, localizations);
    final dayNumber = index - offset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return null;
    }
    return DateTime(year, month, dayNumber);
  }
}

class _DayCell extends StatelessWidget {
  const _DayCell({
    required this.date,
    required this.isToday,
    required this.isSelected,
    required this.isLocked,
    required this.isOutOfPeriod,
    required this.isDisabled,
    required this.isTappable,
    required this.onTap,
  });

  final DateTime date;
  final bool isToday;
  final bool isSelected;
  final bool isLocked;
  final bool isOutOfPeriod;
  final bool isDisabled;
  final bool isTappable;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final baseTextColor = Theme.of(context).textTheme.bodySmall?.color;
    final disabledColor = baseTextColor?.withValues(alpha: 0.35);
    final lockedColor = scheme.error.withValues(alpha: 0.6);
    final outOfPeriodColor = scheme.onSurface.withValues(alpha: 0.35);
    final textColor = isSelected
        ? scheme.onPrimary
        : isLocked
            ? lockedColor
            : isOutOfPeriod
                ? outOfPeriodColor
                : isDisabled
                    ? disabledColor
                    : baseTextColor;
    final background = isSelected
        ? scheme.primary
        : isLocked
            ? scheme.errorContainer.withValues(alpha: 0.35)
            : isOutOfPeriod
                ? scheme.surfaceContainerHighest.withValues(alpha: 0.4)
                : Colors.transparent;
    final borderColor =
        isToday ? scheme.primary.withValues(alpha: 0.6) : Colors.transparent;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: isTappable ? onTap : null,
        child: Container(
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: borderColor, width: 1),
          ),
          alignment: Alignment.center,
          child: Stack(
            children: [
              Center(
                child: Text(
                  '${date.day}',
                  style: TextStyle(
                    fontSize: 14,
                    color: textColor,
                    decoration: (isLocked || isOutOfPeriod)
                        ? TextDecoration.lineThrough
                        : null,
                  ),
                ),
              ),
              if (isLocked)
                Positioned(
                  right: 4,
                  bottom: 4,
                  child: Icon(
                    Icons.lock_outline,
                    size: 12,
                    color: lockedColor,
                  ),
                ),
              if (isOutOfPeriod && !isLocked)
                Positioned(
                  right: 4,
                  bottom: 4,
                  child: Icon(
                    Icons.block,
                    size: 12,
                    color: outOfPeriodColor,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/availability.dart';
import '../../services/periods_service.dart';

class CalendarDialog extends StatefulWidget {
  final DateTime initialDate;
  final DateTime firstDate;
  final DateTime lastDate;
  final PeriodsService periodsService;

  const CalendarDialog({
    super.key,
    required this.initialDate,
    required this.firstDate,
    required this.lastDate,
    required this.periodsService,
  });

  @override
  State<CalendarDialog> createState() => _CalendarDialogState();
}

class _CalendarDialogState extends State<CalendarDialog> {
  late DateTime _focusedMonth;
  DateTime? _selected;
  AvailabilityResponse? _availability;
  bool _isLoading = true;
  String? _errorMessage;
  bool _showMonthPicker = false;

  @override
  void initState() {
    super.initState();
    _focusedMonth = DateTime(widget.initialDate.year, widget.initialDate.month);
    _selected = widget.initialDate;
    _loadAvailability();
  }

  String _monthKey(DateTime month) {
    return '${month.year}-${month.month.toString().padLeft(2, '0')}';
  }

  Future<void> _loadAvailability() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final availability =
          await widget.periodsService.getAvailability(_monthKey(_focusedMonth));

      if (!mounted) return;

      setState(() {
        _availability = availability;
        _isLoading = false;

        if (_selected != null && !availability.isDateAvailable(_selected!)) {
          _selected = null;
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Error al cargar disponibilidad de fechas';
        _isLoading = false;
      });
    }
  }

  bool _isWithinSelectableRange(DateTime date) {
    final day = DateTime(date.year, date.month, date.day);
    final first = DateTime(
        widget.firstDate.year, widget.firstDate.month, widget.firstDate.day);
    final last = DateTime(
        widget.lastDate.year, widget.lastDate.month, widget.lastDate.day);
    return !day.isBefore(first) && !day.isAfter(last);
  }

  bool _isDateAvailable(DateTime date) {
    if (_availability == null) {
      return false;
    }
    return _availability!.isDateAvailable(date);
  }

  void _showUnavailableDateFeedback() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Esta fecha no está disponible para registro'),
      ),
    );
  }

  void _prevMonth() {
    setState(() {
      _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month - 1);
    });
    _loadAvailability();
  }

  void _nextMonth() {
    setState(() {
      _focusedMonth = DateTime(_focusedMonth.year, _focusedMonth.month + 1);
    });
    _loadAvailability();
  }

  String _formatCurrentPeriod() {
    final period = _availability?.currentPeriod;
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
      return '${period.startDate} - ${period.endDate}';
    }
  }

  int _countUnavailableDays() {
    if (_availability == null) return 0;
    final year = _focusedMonth.year;
    final month = _focusedMonth.month;
    final daysInMonth = DateUtils.getDaysInMonth(year, month);
    int unavailable = 0;
    for (int day = 1; day <= daysInMonth; day++) {
      final date = DateTime(year, month, day);
      if (!_availability!.isDateAvailable(date)) {
        unavailable++;
      }
    }
    return unavailable;
  }

  @override
  Widget build(BuildContext context) {
    final year = _focusedMonth.year;
    final monthLabel = DateFormat.MMMM('es_ES').format(_focusedMonth);
    final today =
        DateFormat('d \'de\' MMMM, y', 'es_ES').format(DateTime.now());
    final localizations = MaterialLocalizations.of(context);
    final unavailableCount = _isLoading ? 0 : _countUnavailableDays();

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
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: () => setState(() => _showMonthPicker = !_showMonthPicker),
                    child: Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Theme.of(context).dividerColor),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _capitalize(monthLabel),
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            _showMonthPicker ? Icons.expand_less : Icons.expand_more,
                            size: 16,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Mes siguiente',
                  onPressed: _nextMonth,
                  icon: const Icon(Icons.chevron_right),
                ),
                const SizedBox(width: 4),
                IconButton(
                  tooltip: 'Cerrar',
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                  style: IconButton.styleFrom(
                    foregroundColor: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_showMonthPicker)
              _buildMonthPickerGrid(context),
            if (_showMonthPicker) const SizedBox(height: 12),
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
                          ? 'Cargando disponibilidad...'
                          : _errorMessage != null
                              ? 'Error al cargar disponibilidad'
                              : _availability?.currentPeriod != null
                                  ? 'Período activo: ${_formatCurrentPeriod()}'
                                  : unavailableCount == 0
                                      ? 'Todas las fechas disponibles'
                                      : '$unavailableCount día(s) no disponible(s)',
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
                    color: _errorMessage != null
                        ? Theme.of(context)
                            .colorScheme
                            .errorContainer
                            .withValues(alpha: 0.6)
                        : unavailableCount > 0
                            ? Theme.of(context).colorScheme.errorContainer
                            : Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Icon(
                    _errorMessage != null
                        ? Icons.warning_amber_outlined
                        : unavailableCount > 0
                            ? Icons.lock_outline
                            : Icons.filter_list,
                    color: _errorMessage != null
                        ? Theme.of(context).colorScheme.error
                        : unavailableCount > 0
                            ? Theme.of(context).colorScheme.error
                            : Theme.of(context).colorScheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_errorMessage != null)
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
                        'No se pudo cargar la disponibilidad. Algunas fechas podrían no estar disponibles.',
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
                        final isAvailable = _isDateAvailable(day);
                        final isUnavailable = !isAvailable;
                        final isTappable = isWithinRange;

                        return _DayCell(
                          date: day,
                          isToday: isToday,
                          isSelected: isSelected,
                          isUnavailable: isUnavailable,
                          isDisabled: !isWithinRange,
                          isTappable: isTappable,
                          onTap: () {
                            if (!isWithinRange) {
                              return;
                            }
                            if (isUnavailable) {
                              _showUnavailableDateFeedback();
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
            Material(
              color: Theme.of(context).colorScheme.primary,
              borderRadius: BorderRadius.circular(8),
              child: InkWell(
                borderRadius: BorderRadius.circular(8),
                mouseCursor: SystemMouseCursors.click,
                onTap: () {
                  final now = DateTime.now();
                  final todayDate = DateTime(now.year, now.month, now.day);
                  final isWithinRange = _isWithinSelectableRange(todayDate);

                  setState(() {
                    _focusedMonth =
                        DateTime(todayDate.year, todayDate.month);
                    if (isWithinRange) {
                      _selected = todayDate;
                    }
                  });

                  _loadAvailability();
                },
                child: Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
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

  static const _monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];

  Widget _buildMonthPickerGrid(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final currentMonth = _focusedMonth.month;

    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      padding: const EdgeInsets.all(8),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          mainAxisSpacing: 4,
          crossAxisSpacing: 4,
          childAspectRatio: 2.0,
        ),
        itemCount: 12,
        itemBuilder: (context, index) {
          final month = index + 1;
          final isSelected = month == currentMonth;

          return Material(
            color: isSelected ? scheme.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(6),
            child: InkWell(
              borderRadius: BorderRadius.circular(6),
              onTap: () {
                setState(() {
                  _focusedMonth = DateTime(_focusedMonth.year, month);
                  _showMonthPicker = false;
                });
                _loadAvailability();
              },
              child: Center(
                child: Text(
                  _monthNames[index],
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    color: isSelected ? scheme.onPrimary : scheme.onSurface,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  String _capitalize(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

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
    required this.isUnavailable,
    required this.isDisabled,
    required this.isTappable,
    required this.onTap,
  });

  final DateTime date;
  final bool isToday;
  final bool isSelected;
  final bool isUnavailable;
  final bool isDisabled;
  final bool isTappable;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final baseTextColor = Theme.of(context).textTheme.bodySmall?.color;
    final disabledColor = baseTextColor?.withValues(alpha: 0.35);
    final unavailableColor = scheme.onSurface.withValues(alpha: 0.35);
    final textColor = isSelected
        ? scheme.onPrimary
        : isUnavailable
            ? unavailableColor
            : isDisabled
                ? disabledColor
                : baseTextColor;
    final background = isSelected
        ? scheme.primary
        : isUnavailable
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
                    decoration:
                        isUnavailable ? TextDecoration.lineThrough : null,
                  ),
                ),
              ),
              if (isUnavailable)
                Positioned(
                  right: 4,
                  bottom: 4,
                  child: Icon(
                    Icons.block,
                    size: 12,
                    color: unavailableColor,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

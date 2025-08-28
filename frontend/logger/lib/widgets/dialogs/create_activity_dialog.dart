import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'calendar_dialog.dart';
import '../../models/activity_type.dart';
import '../../services/activity_type_service.dart';

class CreatedActivityResult {
  final ActivityType type;
  final DateTime date;
  final String? description;

  CreatedActivityResult({
    required this.type,
    required this.date,
    this.description,
  });
}

class CreateActivityDialog extends StatefulWidget {
  final String baseUrl;
  final Future<String?> Function() getAccessToken;
  final VoidCallback? onRequireLogin;

  final String typesPath;

  const CreateActivityDialog({
    super.key,
    required this.baseUrl,
    required this.getAccessToken,
    this.onRequireLogin,
    this.typesPath = '/activity-types',
  });

  @override
  State<CreateActivityDialog> createState() => _CreateActivityDialogState();
}

class _CreateActivityDialogState extends State<CreateActivityDialog> {
  final _formKey = GlobalKey<FormState>();

  late final ActivityTypeService _typeService;
  late Future<List<ActivityType>> _typesFuture;

  ActivityType? _selectedType;

  final TextEditingController _dateCtrl = TextEditingController();
  DateTime _selectedDate = DateTime.now();

  final TextEditingController _descCtrl = TextEditingController();

  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _typeService = ActivityTypeService(
      baseUrl: widget.baseUrl,
      getAccessToken: widget.getAccessToken,
      path: widget.typesPath,
    );
    _dateCtrl.text = DateFormat.yMMMMd('es').format(_selectedDate);
    _typesFuture = _typeService.fetchAll();
  }

  @override
  void dispose() {
    _dateCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDialog<DateTime>(
      context: context,
      builder: (ctx) => CalendarDialog(
        initialDate: _selectedDate,
        firstDate: DateTime(2000),
        lastDate: DateTime(2100),
      ),
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
        _dateCtrl.text = DateFormat.yMMMMd('es').format(_selectedDate);
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      Navigator.of(context).pop(
        CreatedActivityResult(
          type: _selectedType!,
          date: _selectedDate,
          description: _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Text(
                    'Crear actividad',
                    style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Cerrar',
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Divider(height: 1, color: theme.dividerColor),
              const SizedBox(height: 12),

              Form(
                key: _formKey,
                child: Column(
                  children: [
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Tipo de actividad',
                        style: theme.textTheme.labelLarge,
                      ),
                    ),
                    const SizedBox(height: 8),

                    FutureBuilder<List<ActivityType>>(
                      future: _typesFuture,
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                                SizedBox(width: 10),
                                Text('Cargando tipos de actividad...'),
                              ],
                            ),
                          );
                        }

                        if (snapshot.hasError) {
                          final err = snapshot.error?.toString() ?? 'Error';
                          final is401 = err.contains('401') || err.toLowerCase().contains('unauthorized');

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                is401
                                    ? 'Tu sesión expiró o no estás autenticado.'
                                    : 'No se pudieron cargar los tipos de actividad.',
                                style: theme.textTheme.bodyMedium
                                    ?.copyWith(color: theme.colorScheme.error),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                err,
                                style: theme.textTheme.bodySmall
                                    ?.copyWith(color: theme.colorScheme.error),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  OutlinedButton.icon(
                                    onPressed: () => setState(() {
                                      _typesFuture = _typeService.fetchAll();
                                    }),
                                    icon: const Icon(Icons.refresh),
                                    label: const Text('Reintentar'),
                                  ),
                                  const SizedBox(width: 8),
                                  if (is401 && widget.onRequireLogin != null)
                                    OutlinedButton.icon(
                                      onPressed: widget.onRequireLogin,
                                      icon: const Icon(Icons.login),
                                      label: const Text('Iniciar sesión'),
                                    ),
                                ],
                              ),
                            ],
                          );
                        }

                        final types = snapshot.data ?? const <ActivityType>[];
                        if (types.isEmpty) {
                          return Text(
                            'No hay tipos de actividad disponibles.',
                            style: theme.textTheme.bodyMedium,
                          );
                        }

                        return DropdownButtonFormField<ActivityType>(
                          value: _selectedType,
                          isExpanded: true,
                          items: types
                              .map(
                                (t) => DropdownMenuItem<ActivityType>(
                                  value: t,
                                  child: Text(t.name),
                                ),
                              )
                              .toList(),
                          onChanged: (v) => setState(() => _selectedType = v),
                          validator: (v) => v == null ? 'Selecciona un tipo' : null,
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            hintText: 'Selecciona un tipo',
                            isDense: true,
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 16),

                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Fecha',
                        style: theme.textTheme.labelLarge,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _dateCtrl,
                      readOnly: true,
                      onTap: _pickDate,
                      decoration: InputDecoration(
                        hintText: 'Selecciona la fecha',
                        isDense: true,
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          tooltip: 'Calendario',
                          onPressed: _pickDate,
                          icon: const Icon(Icons.calendar_today),
                        ),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty)
                          ? 'Selecciona una fecha'
                          : null,
                    ),

                    const SizedBox(height: 16),

                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Descripción (opcional)',
                        style: theme.textTheme.labelLarge,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _descCtrl,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Agrega detalles si lo deseas',
                        border: OutlineInputBorder(),
                      ),
                    ),

                    const SizedBox(height: 20),

                    Row(
                      children: [
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: const Text('Cancelar'),
                        ),
                        const Spacer(),
                        FilledButton.icon(
                          onPressed: _submitting ? null : _submit,
                          icon: _submitting
                              ? const SizedBox(
                                  height: 16,
                                  width: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.save),
                          label: const Text('Guardar'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

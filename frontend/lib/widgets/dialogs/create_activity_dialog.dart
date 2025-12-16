import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

import '../dialogs/calendar_dialog.dart';
import '../../models/activity_type.dart';
import '../../services/activity_type.dart';
import '../../core/validators.dart';
import '../../core/api_client.dart';

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
    this.typesPath = '/activity-types/authorized',
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

  bool _hasExpense = false;
  final TextEditingController _amountCtrl = TextEditingController();

  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final apiClient = ApiClient(
      baseUrl: widget.baseUrl,
      getAccessToken: () async {
        final token = await widget.getAccessToken();
        return token ?? '';
      },
    );
    _typeService = ActivityTypeService(
      apiClient: apiClient,
      path: widget.typesPath,
    );
    _dateCtrl.text = DateFormat.yMMMMd('es').format(_selectedDate);
    _typesFuture = _typeService.fetchAll();
  }

  @override
  void dispose() {
    _dateCtrl.dispose();
    _descCtrl.dispose();
    _amountCtrl.dispose();
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

    final t = await widget.getAccessToken();
    if (t == null || t.isEmpty) {
      widget.onRequireLogin?.call();
      setState(() => _error = 'No estás autenticado.');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final iso = _selectedDate.toUtc().toIso8601String();
      final typeId = _selectedType!.id;
      final desc = _descCtrl.text.trim();
      final hasExp = _hasExpense;
      final amount = (hasExp ? _amountCtrl.text.trim() : null);

      final payload = <String, dynamic>{
        'activityTypeId': typeId,
        'activityDate': iso,
        if (desc.isNotEmpty) 'description': desc,
        'hasExpense': hasExp,
        if (hasExp) 'expenseAmount': amount,
      };

      final resp = await http.post(
        Uri.parse('${widget.baseUrl}/activities'),
        headers: {
          'Authorization': 'Bearer $t',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(payload),
      );

      if (resp.statusCode == 201 || resp.statusCode == 200) {
        final created = jsonDecode(resp.body) as Map<String, dynamic>;
        if (!mounted) return;
        Navigator.of(context).pop(created);
        return;
      }

      if (resp.statusCode == 401) {
        widget.onRequireLogin?.call();
        setState(() =>
            _error = 'Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }

      setState(() => _error = 'Error ${resp.statusCode}: ${resp.body}');
    } catch (e) {
      setState(() => _error = e.toString());
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
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Cerrar',
                    onPressed:
                        _submitting ? null : () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Divider(height: 1, color: theme.dividerColor),
              const SizedBox(height: 12),
              if (_error != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.error.withValues(alpha: 0.08),
                    border: Border.all(
                        color: theme.colorScheme.error.withValues(alpha: 0.3)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _error!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.error,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text('Tipo de actividad',
                          style: theme.textTheme.labelLarge),
                    ),
                    const SizedBox(height: 8),
                    FutureBuilder<List<ActivityType>>(
                      future: _typesFuture,
                      builder: (context, snapshot) {
                        if (snapshot.connectionState ==
                            ConnectionState.waiting) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 18,
                                  height: 18,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
                                ),
                                SizedBox(width: 10),
                                Text('Cargando tipos de actividad...'),
                              ],
                            ),
                          );
                        }

                        if (snapshot.hasError) {
                          final err = snapshot.error?.toString() ?? 'Error';
                          final is401 = err.contains('401') ||
                              err.toLowerCase().contains('unauthorized');

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                is401
                                    ? 'Tu sesión expiró o no estás autenticado.'
                                    : 'No se pudieron cargar los tipos de actividad.',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.error,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                err,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.error,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  OutlinedButton.icon(
                                    onPressed: _submitting
                                        ? null
                                        : () {
                                            setState(() => _typesFuture =
                                                _typeService.fetchAll());
                                          },
                                    icon: const Icon(Icons.refresh),
                                    label: const Text('Reintentar'),
                                  ),
                                  const SizedBox(width: 8),
                                  if (is401 && widget.onRequireLogin != null)
                                    OutlinedButton.icon(
                                      onPressed: _submitting
                                          ? null
                                          : widget.onRequireLogin,
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
                          return Text('No hay tipos de actividad disponibles.',
                              style: theme.textTheme.bodyMedium);
                        }

                        return DropdownButtonFormField<ActivityType>(
                          // ignore: deprecated_member_use
                          value: _selectedType,
                          isExpanded: true,
                          items: types
                              .map((t) => DropdownMenuItem<ActivityType>(
                                    value: t,
                                    child: Text(t.name),
                                  ))
                              .toList(),
                          onChanged: _submitting
                              ? null
                              : (v) => setState(() => _selectedType = v),
                          validator: (v) => Validators.requiredField(
                            v,
                            fieldName: 'El tipo de actividad',
                          ),
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
                      child: Text('Fecha', style: theme.textTheme.labelLarge),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _dateCtrl,
                      readOnly: true,
                      onTap: _submitting ? null : _pickDate,
                      decoration: InputDecoration(
                        hintText: 'Selecciona la fecha',
                        isDense: true,
                        border: const OutlineInputBorder(),
                        suffixIcon: IconButton(
                          tooltip: 'Calendario',
                          onPressed: _submitting ? null : _pickDate,
                          icon: const Icon(Icons.calendar_today),
                        ),
                      ),
                      validator: (v) => Validators.required(
                        v,
                        fieldName: 'La fecha',
                      ),
                    ),
                    const SizedBox(height: 16),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text('Descripción (opcional)',
                          style: theme.textTheme.labelLarge),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _descCtrl,
                      maxLines: 4,
                      readOnly: _submitting,
                      decoration: const InputDecoration(
                        hintText: 'Agrega detalles si lo deseas',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    CheckboxListTile(
                      title: const Text('¿Tiene gastos?'),
                      value: _hasExpense,
                      onChanged: _submitting
                          ? null
                          : (v) => setState(() => _hasExpense = v ?? false),
                      controlAffinity: ListTileControlAffinity.leading,
                    ),
                    if (_hasExpense) ...[
                      TextFormField(
                        controller: _amountCtrl,
                        keyboardType: TextInputType.number,
                        readOnly: _submitting,
                        decoration: const InputDecoration(
                          hintText: 'Monto del gasto',
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) => Validators.combine([
                          () => _hasExpense
                              ? Validators.required(
                                  v,
                                  fieldName: 'El monto del gasto',
                                )
                              : null,
                          () => Validators.positiveNumber(v),
                        ]),
                      ),
                      const SizedBox(height: 16),
                    ],
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        TextButton(
                          onPressed: _submitting
                              ? null
                              : () => Navigator.of(context).pop(),
                          child: const Text('Cancelar'),
                        ),
                        const Spacer(),
                        FilledButton.icon(
                          onPressed: _submitting ? null : _submit,
                          icon: _submitting
                              ? const SizedBox(
                                  height: 16,
                                  width: 16,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
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

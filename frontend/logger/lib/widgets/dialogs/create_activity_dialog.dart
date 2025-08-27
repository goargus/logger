import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'calendar_dialog.dart';
import '../../models/activity_type.dart';
import '../../services/activity_type_service.dart';

class CreateActivityDialog extends StatefulWidget {
  const CreateActivityDialog({super.key});

  @override
  State<CreateActivityDialog> createState() => _CreateActivityDialogState();
}

class _CreateActivityDialogState extends State<CreateActivityDialog> {
  final _formKey = GlobalKey<FormState>();

  // === Estado ===
  ActivityType? _tipoActividad;          // ahora es un objeto del backend
  DateTime? _fecha;
  final _lugarCtrl = TextEditingController();
  final _descripcionCtrl = TextEditingController();
  final _gastoCtrl = TextEditingController();
  String? _imagenPath;                   // si ya lo usabas, lo preservo

  // === Servicio para cargar tipos ===
  late final ActivityTypeService _typeService =
      ActivityTypeService('http://localhost:3000'); // <-- CAMBIA TU BASE URL
  late Future<List<ActivityType>> _typesFuture;

  @override
  void initState() {
    super.initState();
    _typesFuture = _typeService.fetchAll();
  }

  @override
  void dispose() {
    _lugarCtrl.dispose();
    _descripcionCtrl.dispose();
    _gastoCtrl.dispose();
    super.dispose();
  }

Future<void> _pickDate() async {
  final picked = await showDialog<DateTime>(
    context: context,
    builder: (_) => CalendarDialog(
      initialDate: _fecha ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    ),
  );

  if (picked != null) {
    setState(() => _fecha = picked);
  }
}


  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final payload = {
      'activity_type_id': _tipoActividad!.id,
      'date': _fecha!.toIso8601String(),
      'place': _lugarCtrl.text.trim(),
      'description': _descripcionCtrl.text.trim(),
      'expense': _gastoCtrl.text.isEmpty
          ? null
          : double.tryParse(_gastoCtrl.text.replaceAll(',', '.')),
      'imagePath': _imagenPath,
    };

    Navigator.of(context).pop(payload);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Row(
                children: [
                  Text('Crear actividad', style: theme.textTheme.titleLarge),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                    tooltip: 'Cerrar',
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Form
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    // === Dropdown (cargado del backend) ===
                    FutureBuilder<List<ActivityType>>(
                      future: _typesFuture,
                      builder: (context, snapshot) {
                        // Mientras carga, mantengo el espacio y UX del diseño
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: const [
                              LinearProgressIndicator(),
                              SizedBox(height: 12),
                            ],
                          );
                        }

                        if (snapshot.hasError) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                'No se pudieron cargar los tipos de actividad',
                                style: theme.textTheme.bodyMedium
                                    ?.copyWith(color: theme.colorScheme.error),
                              ),
                              const SizedBox(height: 8),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    setState(() {
                                      _typesFuture = _typeService.fetchAll();
                                    });
                                  },
                                  icon: const Icon(Icons.refresh),
                                  label: const Text('Reintentar'),
                                ),
                              ),
                              const SizedBox(height: 12),
                            ],
                          );
                        }

                        final tipos = snapshot.data ?? [];
                        return DropdownButtonFormField<ActivityType>(
                          value: _tipoActividad,
                          items: tipos
                              .map(
                                (t) => DropdownMenuItem<ActivityType>(
                                  value: t,
                                  child: Text(t.name),
                                ),
                              )
                              .toList(),
                          onChanged: (v) => setState(() => _tipoActividad = v),
                          decoration: const InputDecoration(
                            labelText: 'Seleccionar actividad',
                            border: OutlineInputBorder(),
                          ),
                          validator: (v) =>
                              v == null ? 'Seleccione una actividad' : null,
                        );
                      },
                    ),
                    const SizedBox(height: 12),

                    // === Fecha ===
                    InkWell(
                      onTap: _pickDate,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Seleccionar fecha',
                          border: OutlineInputBorder(),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.event),
                            const SizedBox(width: 8),
                            Text(
                              _fecha == null
                                  ? 'Sin fecha'
                                  : DateFormat('dd/MM/yyyy').format(_fecha!),
                            ),
                            const Spacer(),
                            const Icon(Icons.keyboard_arrow_down),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // === Lugar ===
                    TextFormField(
                      controller: _lugarCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Lugar',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? 'Ingrese el lugar' : null,
                    ),
                    const SizedBox(height: 12),

                    // === Descripción ===
                    TextFormField(
                      controller: _descripcionCtrl,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Descripción',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? 'Ingrese una descripción' : null,
                    ),
                    const SizedBox(height: 12),

                    // === Gasto (opcional) ===
                    TextFormField(
                      controller: _gastoCtrl,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Gasto (opcional)',
                        border: OutlineInputBorder(),
                        prefixText: '\$ ',
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) return null;
                        final n = double.tryParse(v.replaceAll(',', '.'));
                        if (n == null) return 'Ingrese un número válido';
                        if (n < 0) return 'No puede ser negativo';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // === Acciones ===
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Cancelar'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _submit,
                            icon: const Icon(Icons.check),
                            label: const Text('Guardar'),
                          ),
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

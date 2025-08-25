import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'calendar_dialog.dart';

class CreateActivityDialog extends StatefulWidget {
  const CreateActivityDialog({super.key});

  @override
  State<CreateActivityDialog> createState() => _CreateActivityDialogState();
}

class _CreateActivityDialogState extends State<CreateActivityDialog> {
  final _formKey = GlobalKey<FormState>();

  String? _tipoActividad;
  DateTime? _fecha;
  final _lugarCtrl = TextEditingController();
  final _descripcionCtrl = TextEditingController();
  final _gastoCtrl = TextEditingController();
  String? _imagenPath;

  final _tipos = const [
    'Estudio Bíblico',
    'Culto en Hogar',
    'Oración',
    'Visita Misionera',
  ];

  @override
  void dispose() {
    _lugarCtrl.dispose();
    _descripcionCtrl.dispose();
    _gastoCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDialog<DateTime>(
      context: context,
      barrierDismissible: false,
      builder: (_) => CalendarDialog(
        initialDate: _fecha ?? now,
        firstDate: DateTime(2025, 6, 1),
        lastDate: DateTime(now.year + 2, 12, 31),
      ),
    );
    if (picked != null) {
      setState(() => _fecha = picked);
    }
  }

  void _submit() {
    if (_formKey.currentState!.validate() && _fecha != null) {
      Navigator.of(context).pop({
        'tipo': _tipoActividad,
        'fecha': _fecha,
        'lugar': _lugarCtrl.text.trim(),
        'descripcion': _descripcionCtrl.text.trim(),
        'gasto': double.tryParse(_gastoCtrl.text) ?? 0.0,
        'imagen': _imagenPath,
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 500),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Crear Nueva Actividad',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Form(
                key: _formKey,
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      DropdownButtonFormField<String>(
                        value: _tipoActividad,
                        items: _tipos
                            .map((t) =>
                                DropdownMenuItem(value: t, child: Text(t)))
                            .toList(),
                        onChanged: (v) => setState(() => _tipoActividad = v),
                        decoration: const InputDecoration(
                          labelText: 'Seleccionar actividad',
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            v == null ? 'Seleccione una actividad' : null,
                      ),
                      const SizedBox(height: 12),

                      InkWell(
                        onTap: _pickDate,
                        child: InputDecorator(
                          decoration: const InputDecoration(
                            labelText: 'Seleccionar fecha',
                            border: OutlineInputBorder(),
                          ),
                          child: Text(
                            _fecha == null
                                ? 'Toca para seleccionar'
                                : DateFormat('d \'de\' MMMM, y', 'es_ES')
                                    .format(_fecha!),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        controller: _lugarCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Ingrese el lugar donde se realizó',
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) =>
                            v == null || v.isEmpty ? 'Campo requerido' : null,
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        controller: _descripcionCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Describa los detalles de la actividad',
                          border: OutlineInputBorder(),
                        ),
                        maxLines: 3,
                      ),
                      const SizedBox(height: 12),

                      TextFormField(
                        controller: _gastoCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Gastos en viáticos',
                          border: OutlineInputBorder(),
                          suffixIcon: Icon(Icons.attach_money),
                        ),
                        keyboardType:
                            const TextInputType.numberWithOptions(decimal: true),
                      ),
                      const SizedBox(height: 12),

                      GestureDetector(
                        onTap: () {
                          setState(() => _imagenPath = 'fake/path/image.png');
                        },
                        child: Container(
                          height: 120,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade400),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: _imagenPath == null
                                ? const Text('Toca para agregar imagen')
                                : Text('Imagen: $_imagenPath'),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

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
                            child: ElevatedButton(
                              onPressed: _submit,
                              child: const Text('Crear Actividad'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

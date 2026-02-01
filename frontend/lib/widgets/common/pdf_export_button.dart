import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';
import '../../models/activity.dart';
import '../../models/activities_filter.dart';
import '../../providers/auth.dart';
import '../../services/pdf_service.dart';

class PdfExportButton extends ConsumerStatefulWidget {
  final List<Activity> activities;
  final ActivitiesFilter filter;

  const PdfExportButton({
    super.key,
    required this.activities,
    required this.filter,
  });

  @override
  ConsumerState<PdfExportButton> createState() => _PdfExportButtonState();
}

class _PdfExportButtonState extends ConsumerState<PdfExportButton> {
  bool _isGenerating = false;

  String? _resolveRequestorName(Map<String, dynamic>? user) {
    if (user == null) return null;
    return user['full_name'] as String? ??
        user['first_name'] as String? ??
        user['name'] as String? ??
        user['nickname'] as String? ??
        user['username'] as String? ??
        user['email'] as String?;
  }

  Future<void> _generatePdf() async {
    if (widget.activities.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No hay actividades para exportar'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    setState(() => _isGenerating = true);

    try {
      final pdfService = PdfService();
      final authState = ref.read(authNotifierProvider);
      final requestorName = _resolveRequestorName(authState.user);
      final pdfBytes = await pdfService.generateActivitiesReport(
        activities: widget.activities,
        filter: widget.filter,
        requestorName: requestorName,
      );

      await Printing.sharePdf(
        bytes: pdfBytes,
        filename: 'actividades_${DateTime.now().millisecondsSinceEpoch}.pdf',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error generando PDF: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGenerating = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: _isGenerating ? null : _generatePdf,
      icon: _isGenerating
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Icon(Icons.picture_as_pdf, size: 18),
      label: Text(_isGenerating ? 'Generando...' : 'Exportar PDF'),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
  }
}

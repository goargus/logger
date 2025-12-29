import 'dart:html' as html;
import 'dart:convert';
import 'package:flutter/material.dart';

/// Button widget for exporting reports
class ExportButton extends StatefulWidget {
  const ExportButton({
    super.key,
    required this.onExport,
    this.formats = const ['csv', 'json'],
    this.reportTypes = const ['activities', 'summary', 'compliance'],
  });

  final Future<ExportData> Function(String format, String reportType) onExport;
  final List<String> formats;
  final List<String> reportTypes;

  @override
  State<ExportButton> createState() => _ExportButtonState();
}

class _ExportButtonState extends State<ExportButton> {
  bool _isExporting = false;

  String _getFormatLabel(String format) {
    switch (format) {
      case 'csv':
        return 'CSV';
      case 'json':
        return 'JSON';
      default:
        return format.toUpperCase();
    }
  }

  String _getReportTypeLabel(String type) {
    switch (type) {
      case 'activities':
        return 'Actividades';
      case 'summary':
        return 'Resumen';
      case 'compliance':
        return 'Cumplimiento';
      default:
        return type;
    }
  }

  IconData _getReportTypeIcon(String type) {
    switch (type) {
      case 'activities':
        return Icons.list_alt;
      case 'summary':
        return Icons.analytics;
      case 'compliance':
        return Icons.people;
      default:
        return Icons.description;
    }
  }

  Future<void> _handleExport(String format, String reportType) async {
    setState(() => _isExporting = true);

    try {
      final data = await widget.onExport(format, reportType);
      _downloadFile(data);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Exportado: ${data.filename}'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al exportar: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isExporting = false);
      }
    }
  }

  void _downloadFile(ExportData data) {
    final blob = html.Blob([data.bytes], data.mimeType);
    final url = html.Url.createObjectUrlFromBlob(blob);
    final anchor = html.AnchorElement(href: url)
      ..setAttribute('download', data.filename)
      ..style.display = 'none';
    html.document.body!.children.add(anchor);
    anchor.click();
    html.document.body!.children.remove(anchor);
    html.Url.revokeObjectUrl(url);
  }

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<_ExportOption>(
      enabled: !_isExporting,
      tooltip: 'Exportar reporte',
      onSelected: (option) => _handleExport(option.format, option.reportType),
      itemBuilder: (context) {
        final items = <PopupMenuEntry<_ExportOption>>[];

        for (final reportType in widget.reportTypes) {
          // Add header for each report type
          items.add(
            PopupMenuItem<_ExportOption>(
              enabled: false,
              child: Row(
                children: [
                  Icon(_getReportTypeIcon(reportType), size: 18),
                  const SizedBox(width: 8),
                  Text(
                    _getReportTypeLabel(reportType),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          );

          // Add format options for this report type
          for (final format in widget.formats) {
            items.add(
              PopupMenuItem<_ExportOption>(
                value: _ExportOption(format: format, reportType: reportType),
                child: Padding(
                  padding: const EdgeInsets.only(left: 26),
                  child: Text('Descargar ${_getFormatLabel(format)}'),
                ),
              ),
            );
          }

          // Add divider between report types (except for last one)
          if (reportType != widget.reportTypes.last) {
            items.add(const PopupMenuDivider());
          }
        }

        return items;
      },
      child: _isExporting
          ? const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.download),
                SizedBox(width: 4),
                Text('Exportar'),
                Icon(Icons.arrow_drop_down),
              ],
            ),
    );
  }
}

class _ExportOption {
  final String format;
  final String reportType;

  const _ExportOption({required this.format, required this.reportType});
}

/// Data structure for export results
class ExportData {
  final List<int> bytes;
  final String filename;
  final String mimeType;

  const ExportData({
    required this.bytes,
    required this.filename,
    required this.mimeType,
  });

  factory ExportData.fromString(String content, String filename, String mimeType) {
    return ExportData(
      bytes: utf8.encode(content),
      filename: filename,
      mimeType: mimeType,
    );
  }
}

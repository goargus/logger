import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import '../models/activity.dart';
import '../models/activities_filter.dart';

class PdfService {
  Future<Uint8List> generateActivitiesReport({
    required List<Activity> activities,
    required ActivitiesFilter filter,
    String? requestorName,
  }) async {
    final pdf = pw.Document();

    // Calculate summary stats
    final totalActivities = activities.length;
    final activitiesWithExpense = activities.where((a) => a.hasExpense).length;
    final totalExpenses = activities.fold<double>(
      0,
      (sum, a) => sum + (a.hasExpense ? a.expense : 0),
    );

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.letter,
        margin: const pw.EdgeInsets.all(40),
        header: (context) => _buildHeader(context, filter, requestorName),
        footer: (context) => _buildFooter(context),
        build: (context) => [
          pw.SizedBox(height: 20),

          // Summary stats
          _buildSummarySection(
              totalActivities, activitiesWithExpense, totalExpenses),
          pw.SizedBox(height: 30),

          // Activities table
          if (activities.isEmpty)
            pw.Center(
              child: pw.Padding(
                padding: const pw.EdgeInsets.all(40),
                child: pw.Text(
                  'No hay actividades para mostrar',
                  style: pw.TextStyle(
                    fontSize: 14,
                    color: PdfColors.grey700,
                  ),
                ),
              ),
            )
          else
            _buildActivitiesTable(activities),
        ],
      ),
    );

    return pdf.save();
  }

  pw.Widget _buildHeader(
    pw.Context context,
    ActivitiesFilter filter,
    String? requestorName,
  ) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(
              'Reporte de Actividades',
              style: pw.TextStyle(
                fontSize: 24,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
            pw.Text(
              _formatDate(DateTime.now()),
              style: const pw.TextStyle(
                fontSize: 10,
                color: PdfColors.grey600,
              ),
            ),
          ],
        ),
        pw.SizedBox(height: 8),
        if (filter.startDate != null || filter.endDate != null)
          pw.Text(
            'Periodo: ${_formatDate(filter.startDate)} - ${_formatDate(filter.endDate)}',
            style: const pw.TextStyle(
              fontSize: 12,
              color: PdfColors.grey700,
            ),
          ),
        if (requestorName != null && requestorName.isNotEmpty)
          pw.Text(
            'Solicitado por: $requestorName',
            style: const pw.TextStyle(
              fontSize: 11,
              color: PdfColors.grey700,
            ),
          ),
        pw.SizedBox(height: 4),
        pw.Divider(color: PdfColors.grey400),
      ],
    );
  }

  pw.Widget _buildFooter(pw.Context context) {
    return pw.Column(
      children: [
        pw.Divider(color: PdfColors.grey300),
        pw.SizedBox(height: 4),
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(
              'Generado automaticamente',
              style: const pw.TextStyle(
                fontSize: 9,
                color: PdfColors.grey500,
              ),
            ),
            pw.Text(
              'Pagina ${context.pageNumber} de ${context.pagesCount}',
              style: const pw.TextStyle(
                fontSize: 9,
                color: PdfColors.grey500,
              ),
            ),
          ],
        ),
      ],
    );
  }

  pw.Widget _buildSummarySection(
    int totalActivities,
    int activitiesWithExpense,
    double totalExpenses,
  ) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(16),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: PdfColors.grey400),
        borderRadius: pw.BorderRadius.circular(8),
        color: PdfColors.grey100,
      ),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
        children: [
          _buildStatColumn('Total Actividades', totalActivities.toString()),
          _buildStatColumn('Con Gastos', activitiesWithExpense.toString()),
          _buildStatColumn(
            'Total Gastos',
            'L.${totalExpenses.toStringAsFixed(2)}',
          ),
        ],
      ),
    );
  }

  pw.Widget _buildStatColumn(String label, String value) {
    return pw.Column(
      children: [
        pw.Text(
          value,
          style: pw.TextStyle(
            fontSize: 20,
            fontWeight: pw.FontWeight.bold,
          ),
        ),
        pw.SizedBox(height: 4),
        pw.Text(
          label,
          style: const pw.TextStyle(
            fontSize: 10,
            color: PdfColors.grey700,
          ),
        ),
      ],
    );
  }

  pw.Widget _buildActivitiesTable(List<Activity> activities) {
    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey400),
      columnWidths: {
        0: const pw.FlexColumnWidth(1.3),
        1: const pw.FlexColumnWidth(1.8),
        2: const pw.FlexColumnWidth(2),
        3: const pw.FlexColumnWidth(3),
        4: const pw.FlexColumnWidth(1.5),
      },
      children: [
        // Header row
        pw.TableRow(
          decoration: const pw.BoxDecoration(
            color: PdfColors.grey200,
          ),
          children: [
            _buildTableCell('Fecha', isHeader: true),
            _buildTableCell('Tipo', isHeader: true),
            _buildTableCell('Propietario', isHeader: true),
            _buildTableCell('Descripcion', isHeader: true),
            _buildTableCell('Gasto', isHeader: true),
          ],
        ),
        // Data rows
        ...activities.map((a) => pw.TableRow(
              children: [
                _buildTableCell(_formatDate(a.date)),
                _buildTableCell(a.category),
                _buildTableCell(a.ownerUsername?.isNotEmpty == true
                    ? a.ownerUsername!
                    : '-'),
                _buildTableCell(
                  a.description.length > 60
                      ? '${a.description.substring(0, 60)}...'
                      : a.description.isNotEmpty
                          ? a.description
                          : '-',
                ),
                _buildTableCell(
                  a.hasExpense ? 'L.${a.expense.toStringAsFixed(2)}' : '-',
                ),
              ],
            )),
      ],
    );
  }

  pw.Widget _buildTableCell(String text, {bool isHeader = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(8),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: isHeader ? 11 : 10,
          fontWeight: isHeader ? pw.FontWeight.bold : pw.FontWeight.normal,
        ),
      ),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '-';
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
}

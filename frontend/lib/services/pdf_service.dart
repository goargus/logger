import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import '../models/activity.dart';
import '../models/activities_filter.dart';
import '../models/engagement_report.dart';
import '../models/hierarchy_breakdown.dart';
import '../models/report_breakdown.dart';
import '../utils/currency_formatter.dart';

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

  Future<Uint8List> generateSummaryReport({
    required HierarchySummaryResponse summary,
    required DateTime periodStart,
    required DateTime periodEnd,
    required String currencySymbol,
    String? requestorName,
  }) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.letter,
        margin: const pw.EdgeInsets.all(40),
        header: (context) => _buildReportHeader(
          title: 'Reporte de Resumen',
          entityName: summary.entityName,
          periodStart: periodStart,
          periodEnd: periodEnd,
          requestorName: requestorName,
        ),
        footer: (context) => _buildFooter(context),
        build: (context) => [
          pw.SizedBox(height: 20),
          _buildSummarySection(
            summary.totalActivities,
            summary.activeUsers,
            summary.totalExpenses,
            currencySymbol: currencySymbol,
            compliancePercent: summary.activePercent,
            usersExpected: summary.totalUsers,
          ),
          pw.SizedBox(height: 24),
          if (summary.hasHierarchyBreakdown)
            _buildHierarchyBreakdownTable(
              summary.hierarchyBreakdown,
              currencySymbol: currencySymbol,
            )
          else
            _buildEmptyState('No hay desglose de jerarquia disponible'),
        ],
      ),
    );

    return pdf.save();
  }

  Future<Uint8List> generateActivitiesBreakdownReport({
    required List<ReportBreakdown> breakdowns,
    required HierarchySummaryResponse summary,
    required DateTime periodStart,
    required DateTime periodEnd,
    required String currencySymbol,
    String? requestorName,
  }) async {
    final pdf = pw.Document();
    final totalActivities =
        breakdowns.fold<int>(0, (sum, item) => sum + item.count);
    final totalExpenses = breakdowns.fold<double>(
      0,
      (sum, item) => sum + item.totalExpenses,
    );

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.letter,
        margin: const pw.EdgeInsets.all(40),
        header: (context) => _buildReportHeader(
          title: 'Reporte de Actividades',
          entityName: summary.entityName,
          periodStart: periodStart,
          periodEnd: periodEnd,
          requestorName: requestorName,
        ),
        footer: (context) => _buildFooter(context),
        build: (context) => [
          pw.SizedBox(height: 20),
          _buildActivitiesBreakdownSummary(
            totalActivities,
            totalExpenses,
            currencySymbol,
          ),
          pw.SizedBox(height: 24),
          if (breakdowns.isEmpty)
            _buildEmptyState('No hay actividades para mostrar')
          else
            _buildActivitiesBreakdownTable(breakdowns, currencySymbol),
        ],
      ),
    );

    return pdf.save();
  }

  Future<Uint8List> generateEngagementReport({
    required EngagementResponse engagement,
    required String entityName,
    required DateTime periodStart,
    required DateTime periodEnd,
    String? requestorName,
  }) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.letter,
        margin: const pw.EdgeInsets.all(40),
        header: (context) => _buildReportHeader(
          title: 'Reporte de Participacion',
          entityName: entityName,
          periodStart: periodStart,
          periodEnd: periodEnd,
          requestorName: requestorName,
        ),
        footer: (context) => _buildFooter(context),
        build: (context) => [
          pw.SizedBox(height: 20),
          _buildEngagementSummary(engagement.summary),
          pw.SizedBox(height: 24),
          if (engagement.users.isNotEmpty)
            _buildEngagementUsersTable(engagement.users)
          else
            _buildEmptyState('No hay usuarios para mostrar'),
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

  pw.Widget _buildReportHeader({
    required String title,
    required DateTime periodStart,
    required DateTime periodEnd,
    String? entityName,
    String? requestorName,
  }) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(
              title,
              style: pw.TextStyle(
                fontSize: 22,
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
        pw.SizedBox(height: 6),
        pw.Text(
          'Periodo: ${_formatDate(periodStart)} - ${_formatDate(periodEnd)}',
          style: const pw.TextStyle(
            fontSize: 11,
            color: PdfColors.grey700,
          ),
        ),
        if (entityName != null && entityName.isNotEmpty)
          pw.Text(
            'Entidad: $entityName',
            style: const pw.TextStyle(
              fontSize: 11,
              color: PdfColors.grey700,
            ),
          ),
        if (requestorName != null && requestorName.isNotEmpty)
          pw.Text(
            'Solicitado por: $requestorName',
            style: const pw.TextStyle(
              fontSize: 10,
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
      int totalActivities, int activitiesWithExpense, double totalExpenses,
      {String currencySymbol = 'L',
      double? compliancePercent,
      int? usersExpected}) {
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
          if (usersExpected != null && compliancePercent != null)
            _buildStatColumn(
              'Participacion',
              '${compliancePercent.toStringAsFixed(0)}%',
            )
          else
            _buildStatColumn('Con Gastos', activitiesWithExpense.toString()),
          _buildStatColumn(
            'Total Gastos',
            _formatCurrency(totalExpenses, currencySymbol),
          ),
        ],
      ),
    );
  }

  pw.Widget _buildActivitiesBreakdownSummary(
    int totalActivities,
    double totalExpenses,
    String currencySymbol,
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
          _buildStatColumn(
            'Total Gastos',
            _formatCurrency(totalExpenses, currencySymbol),
          ),
        ],
      ),
    );
  }

  pw.Widget _buildEngagementSummary(EngagementSummary summary) {
    final participationPercent = summary.totalUsers == 0
        ? 0
        : (summary.activeUsers / summary.totalUsers) * 100;

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
          _buildStatColumn('Total Usuarios', summary.totalUsers.toString()),
          _buildStatColumn('Activos', summary.activeUsers.toString()),
          _buildStatColumn('Inactivos', summary.inactiveUsers.toString()),
          _buildStatColumn(
            'Participacion %',
            '${participationPercent.toStringAsFixed(0)}%',
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

  pw.Widget _buildSectionTitle(String title) {
    return pw.Text(
      title,
      style: pw.TextStyle(
        fontSize: 13,
        fontWeight: pw.FontWeight.bold,
      ),
    );
  }

  pw.Widget _buildEmptyState(String message) {
    return pw.Center(
      child: pw.Padding(
        padding: const pw.EdgeInsets.all(30),
        child: pw.Text(
          message,
          style: pw.TextStyle(
            fontSize: 12,
            color: PdfColors.grey700,
          ),
        ),
      ),
    );
  }

  pw.Widget _buildHierarchyBreakdownTable(
      List<HierarchyEntityBreakdown> breakdown,
      {required String currencySymbol}) {
    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey400),
      columnWidths: {
        0: const pw.FlexColumnWidth(2.5),
        1: const pw.FlexColumnWidth(1.4),
        2: const pw.FlexColumnWidth(1.2),
        3: const pw.FlexColumnWidth(1.4),
        4: const pw.FlexColumnWidth(1.4),
      },
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: PdfColors.grey200),
          children: [
            _buildTableCell('Entidad', isHeader: true),
            _buildTableCell('Tipo', isHeader: true),
            _buildTableCell('Actividades', isHeader: true),
            _buildTableCell('Gastos', isHeader: true),
            _buildTableCell('Participacion', isHeader: true),
          ],
        ),
        ...breakdown.map(
          (item) => pw.TableRow(
            children: [
              _buildTableCell(item.entityName),
              _buildTableCell(item.entityType.displayName),
              _buildTableCell(item.activities.toString()),
              _buildTableCell(
                _formatCurrency(item.expenses, currencySymbol),
              ),
              _buildTableCell(item.activeDisplay),
            ],
          ),
        ),
      ],
    );
  }

  pw.Widget _buildActivitiesBreakdownTable(
    List<ReportBreakdown> breakdowns,
    String currencySymbol,
  ) {
    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey400),
      columnWidths: {
        0: const pw.FlexColumnWidth(3),
        1: const pw.FlexColumnWidth(1.3),
        2: const pw.FlexColumnWidth(1.5),
      },
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: PdfColors.grey200),
          children: [
            _buildTableCell('Tipo de Actividad', isHeader: true),
            _buildTableCell('Cantidad', isHeader: true),
            _buildTableCell('Gastos', isHeader: true),
          ],
        ),
        ...breakdowns.map(
          (item) => pw.TableRow(
            children: [
              _buildTableCell(item.activityTypeName),
              _buildTableCell(item.count.toString()),
              _buildTableCell(
                _formatCurrency(item.totalExpenses, currencySymbol),
              ),
            ],
          ),
        ),
      ],
    );
  }

  pw.Widget _buildEngagementUsersTable(List<EngagementUser> users) {
    return pw.Table(
      border: pw.TableBorder.all(color: PdfColors.grey400),
      columnWidths: {
        0: const pw.FlexColumnWidth(2),
        1: const pw.FlexColumnWidth(1.8),
        2: const pw.FlexColumnWidth(1.5),
        3: const pw.FlexColumnWidth(1),
        4: const pw.FlexColumnWidth(1.5),
        5: const pw.FlexColumnWidth(1),
      },
      children: [
        pw.TableRow(
          decoration: const pw.BoxDecoration(color: PdfColors.grey200),
          children: [
            _buildTableCell('Nombre', isHeader: true),
            _buildTableCell('Entidad', isHeader: true),
            _buildTableCell('Roles', isHeader: true),
            _buildTableCell('Actividades', isHeader: true),
            _buildTableCell('Ultima Actividad', isHeader: true),
            _buildTableCell('Tendencia', isHeader: true),
          ],
        ),
        ...users.map(
          (user) => pw.TableRow(
            children: [
              _buildTableCell(user.name),
              _buildTableCell(user.entity),
              _buildTableCell(user.roles.join(', ')),
              _buildTableCell(user.activityCount.toString()),
              _buildTableCell(_formatDateString(user.lastActivityDate)),
              _buildTableCell(
                user.trend != null
                    ? '${user.trend! >= 0 ? '+' : ''}${user.trend!.toStringAsFixed(0)}%'
                    : '-',
              ),
            ],
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
                  a.hasExpense ? _formatCurrency(a.expense, 'L') : '-',
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

  String _formatDateString(String? raw) {
    if (raw == null || raw.isEmpty) return '-';
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return raw;
    return _formatDate(parsed);
  }

  String _formatCurrency(double value, String currencySymbol) {
    return CurrencyFormatter.format(value, currencySymbol);
  }
}

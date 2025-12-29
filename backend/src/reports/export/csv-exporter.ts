import { Injectable } from '@nestjs/common';
import { Activity } from '../../activity/activity.entity';
import { SummaryResponse, ComplianceResponse } from '../dto/report-responses.dto';

export interface CsvExportOptions {
  includeHeaders?: boolean;
  delimiter?: string;
}

interface ActivityRow {
  date: string;
  userName: string;
  userEmail: string;
  entityName: string;
  activityType: string;
  description: string;
  hasExpense: string;
  expenseAmount: string;
  status: string;
  createdAt: string;
  [key: string]: string;
}

@Injectable()
export class CsvExporter {
  private readonly defaultOptions: CsvExportOptions = {
    includeHeaders: true,
    delimiter: ',',
  };

  /**
   * Escape a value for CSV format
   */
  private escapeValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // Check if escaping is needed
    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      // Escape double quotes by doubling them
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Convert array of objects to CSV string
   */
  private arrayToCsv<T extends Record<string, unknown>>(
    data: T[],
    columns: { key: keyof T; header: string }[],
    options: CsvExportOptions = {},
  ): string {
    const opts = { ...this.defaultOptions, ...options };
    const lines: string[] = [];

    // Add headers
    if (opts.includeHeaders) {
      const headerLine = columns.map((col) => this.escapeValue(col.header)).join(opts.delimiter);
      lines.push(headerLine);
    }

    // Add data rows
    for (const row of data) {
      const rowValues = columns.map((col) => this.escapeValue(row[col.key]));
      lines.push(rowValues.join(opts.delimiter));
    }

    return lines.join('\n');
  }

  /**
   * Export activities to CSV
   */
  exportActivities(activities: Activity[]): string {
    const columns: { key: keyof ActivityRow; header: string }[] = [
      { key: 'date', header: 'Fecha' },
      { key: 'userName', header: 'Usuario' },
      { key: 'userEmail', header: 'Email' },
      { key: 'entityName', header: 'Entidad' },
      { key: 'activityType', header: 'Tipo de Actividad' },
      { key: 'description', header: 'Descripcion' },
      { key: 'hasExpense', header: 'Tiene Gasto' },
      { key: 'expenseAmount', header: 'Monto del Gasto' },
      { key: 'status', header: 'Estado' },
      { key: 'createdAt', header: 'Fecha de Creacion' },
    ];

    const data: ActivityRow[] = activities.map((a) => ({
      date: a.activityDate || '',
      userName:
        a.user?.full_name ||
        `${a.user?.first_name || ''} ${a.user?.family_name || ''}`.trim() ||
        '',
      userEmail: a.user?.email || '',
      entityName: a.user?.entity?.name || '',
      activityType: a.activityType?.name || '',
      description: a.description || '',
      hasExpense: a.hasExpense ? 'Si' : 'No',
      expenseAmount: a.hasExpense && a.expenseAmount ? a.expenseAmount : '',
      status: a.status || '',
      createdAt: a.createdAt ? a.createdAt.toISOString().split('T')[0] : '',
    }));

    return this.arrayToCsv(data, columns);
  }

  /**
   * Export summary report to CSV
   */
  exportSummary(summary: SummaryResponse): string {
    const lines: string[] = [];

    // Add title section
    lines.push('Resumen de Reportes');
    lines.push(`Entidad,${this.escapeValue(summary.entity.name)}`);
    lines.push('');

    // Add summary metrics
    lines.push('Metrica,Valor');
    lines.push(`Total Actividades,${summary.totals.activities}`);
    lines.push(`Total Gastos,${summary.totals.expenses}`);
    lines.push(`Usuarios que Reportaron,${summary.totals.usersSubmitted}`);
    lines.push(`Usuarios Esperados,${summary.totals.usersExpected}`);
    lines.push(`Tasa de Cumplimiento,${(summary.totals.complianceRate * 100).toFixed(1)}%`);
    lines.push('');

    // Add hierarchy breakdown if available
    if (summary.hierarchyBreakdown && summary.hierarchyBreakdown.length > 0) {
      lines.push('Desglose por Entidad');
      lines.push('Entidad,Tipo,Actividades,Gastos,Usuarios,Cumplimiento');

      for (const entity of summary.hierarchyBreakdown) {
        lines.push(
          [
            this.escapeValue(entity.entityName),
            this.escapeValue(entity.entityType),
            entity.activities,
            entity.expenses,
            entity.usersSubmitted,
            `${(entity.complianceRate * 100).toFixed(1)}%`,
          ].join(','),
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * Export compliance report to CSV
   */
  exportCompliance(compliance: ComplianceResponse): string {
    const lines: string[] = [];

    // Add title section
    lines.push('Reporte de Cumplimiento');
    lines.push('');

    // Summary
    const total = compliance.submitted.length + compliance.notSubmitted.length;
    const complianceRate = total > 0 ? (compliance.submitted.length / total) * 100 : 0;
    lines.push('Resumen');
    lines.push(`Total Usuarios,${total}`);
    lines.push(`Han Reportado,${compliance.submitted.length}`);
    lines.push(`Sin Reportar,${compliance.notSubmitted.length}`);
    lines.push(`Tasa de Cumplimiento,${complianceRate.toFixed(1)}%`);
    lines.push('');

    // Submitted users
    if (compliance.submitted.length > 0) {
      lines.push('Usuarios que Han Reportado');
      lines.push('Nombre,ID Usuario,Cantidad de Actividades,Ultima Actividad');

      for (const user of compliance.submitted) {
        lines.push(
          [this.escapeValue(user.name), user.userId, user.count, user.lastActivity || ''].join(','),
        );
      }
      lines.push('');
    }

    // Not submitted users
    if (compliance.notSubmitted.length > 0) {
      lines.push('Usuarios Sin Reportar');
      lines.push('Nombre,ID Usuario,Entidad,Roles');

      for (const user of compliance.notSubmitted) {
        lines.push(
          [
            this.escapeValue(user.name),
            user.userId,
            this.escapeValue(user.entity),
            this.escapeValue(user.roles.join('; ')),
          ].join(','),
        );
      }
    }

    return lines.join('\n');
  }
}

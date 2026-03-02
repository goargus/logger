import { Injectable } from '@nestjs/common';
import { Activity } from '../../activity/activity.entity';
import { SummaryResponse, EngagementResponse } from '../dto/report-responses.dto';

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
  escapeValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    let stringValue = String(value);

    // Neutralize formula-triggering characters to prevent CSV injection (OWASP)
    if (/^[=+\-@\t\r]/.test(stringValue)) {
      stringValue = "'" + stringValue;
    }

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
    lines.push(`Usuarios Activos,${summary.totals.activeUsers}`);
    lines.push(`Total Usuarios,${summary.totals.totalUsers}`);
    lines.push(`Tasa de Participacion,${(summary.totals.activeRate * 100).toFixed(1)}%`);
    lines.push(`Promedio Actividades por Usuario,${summary.totals.avgActivitiesPerUser}`);
    lines.push('');

    // Add hierarchy breakdown if available
    if (summary.hierarchyBreakdown && summary.hierarchyBreakdown.length > 0) {
      lines.push('Desglose por Entidad');
      lines.push('Entidad,Tipo,Actividades,Gastos,Usuarios Activos,Participacion');

      for (const entity of summary.hierarchyBreakdown) {
        lines.push(
          [
            this.escapeValue(entity.entityName),
            this.escapeValue(entity.entityType),
            entity.activities,
            entity.expenses,
            entity.activeUsers,
            `${(entity.activeRate * 100).toFixed(1)}%`,
          ].join(','),
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * Export engagement report to CSV
   */
  exportEngagement(engagement: EngagementResponse): string {
    const lines: string[] = [];

    lines.push('Reporte de Participacion');
    lines.push('');

    // Summary
    lines.push('Resumen');
    lines.push(`Total Usuarios,${engagement.summary.totalUsers}`);
    lines.push(`Usuarios Activos,${engagement.summary.activeUsers}`);
    lines.push(`Usuarios Inactivos,${engagement.summary.inactiveUsers}`);
    lines.push(`Promedio Actividades por Usuario,${engagement.summary.avgActivitiesPerUser}`);
    lines.push('');

    // Unified user table
    if (engagement.users.length > 0) {
      lines.push('Detalle por Usuario');
      lines.push('Nombre,Entidad,Roles,Actividades,Ultima Actividad,Tendencia');

      for (const user of engagement.users) {
        lines.push(
          [
            this.escapeValue(user.name),
            this.escapeValue(user.entity),
            this.escapeValue(user.roles.join('; ')),
            user.activityCount,
            user.lastActivityDate || '',
            user.trend !== null ? `${user.trend}%` : '',
          ].join(','),
        );
      }
    }

    return lines.join('\n');
  }
}

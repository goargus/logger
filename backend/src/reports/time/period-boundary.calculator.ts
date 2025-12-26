import { Injectable } from '@nestjs/common';
import { ReportPeriodType } from '../enums/report-period-type.enum';

export interface PeriodBoundaries {
  dateFrom: Date;
  dateTo: Date;
  label: string;
}

export interface PeriodReference {
  year: number;
  periodIndex: number;
}

@Injectable()
export class PeriodBoundaryCalculator {
  calculateBoundaries(
    periodType: ReportPeriodType,
    year: number,
    periodIndex: number,
  ): PeriodBoundaries {
    switch (periodType) {
      case ReportPeriodType.MONTHLY:
        return this.calculateMonthlyBoundaries(year, periodIndex);
      case ReportPeriodType.QUARTERLY:
        return this.calculateQuarterlyBoundaries(year, periodIndex);
      case ReportPeriodType.BIANNUAL:
        return this.calculateBiannualBoundaries(year, periodIndex);
      case ReportPeriodType.ANNUAL:
        return this.calculateAnnualBoundaries(year);
    }
  }

  getPreviousPeriod(
    periodType: ReportPeriodType,
    year: number,
    periodIndex: number,
  ): PeriodReference {
    switch (periodType) {
      case ReportPeriodType.MONTHLY:
        if (periodIndex === 1) {
          return { year: year - 1, periodIndex: 12 };
        }
        return { year, periodIndex: periodIndex - 1 };

      case ReportPeriodType.QUARTERLY:
        if (periodIndex === 1) {
          return { year: year - 1, periodIndex: 4 };
        }
        return { year, periodIndex: periodIndex - 1 };

      case ReportPeriodType.BIANNUAL:
        if (periodIndex === 1) {
          return { year: year - 1, periodIndex: 2 };
        }
        return { year, periodIndex: periodIndex - 1 };

      case ReportPeriodType.ANNUAL:
        return { year: year - 1, periodIndex: 1 };
    }
  }

  getPeriodIndexFromQuery(
    periodType: ReportPeriodType,
    month?: number,
    quarter?: number,
    half?: number,
  ): number {
    switch (periodType) {
      case ReportPeriodType.MONTHLY:
        return month ?? new Date().getMonth() + 1;
      case ReportPeriodType.QUARTERLY:
        return quarter ?? Math.ceil((new Date().getMonth() + 1) / 3);
      case ReportPeriodType.BIANNUAL:
        return half ?? (new Date().getMonth() < 6 ? 1 : 2);
      case ReportPeriodType.ANNUAL:
        return 1;
    }
  }

  private calculateMonthlyBoundaries(year: number, month: number): PeriodBoundaries {
    const dateFrom = new Date(year, month - 1, 1);
    const dateTo = new Date(year, month, 0, 23, 59, 59, 999);
    const label = this.formatMonthLabel(year, month);
    return { dateFrom, dateTo, label };
  }

  private calculateQuarterlyBoundaries(year: number, quarter: number): PeriodBoundaries {
    const startMonth = (quarter - 1) * 3;
    const dateFrom = new Date(year, startMonth, 1);
    const dateTo = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    const label = `T${quarter} ${year}`;
    return { dateFrom, dateTo, label };
  }

  private calculateBiannualBoundaries(year: number, half: number): PeriodBoundaries {
    const startMonth = (half - 1) * 6;
    const dateFrom = new Date(year, startMonth, 1);
    const dateTo = new Date(year, startMonth + 6, 0, 23, 59, 59, 999);
    const label = half === 1 ? `Primer Semestre ${year}` : `Segundo Semestre ${year}`;
    return { dateFrom, dateTo, label };
  }

  private calculateAnnualBoundaries(year: number): PeriodBoundaries {
    const dateFrom = new Date(year, 0, 1);
    const dateTo = new Date(year, 11, 31, 23, 59, 59, 999);
    const label = year.toString();
    return { dateFrom, dateTo, label };
  }

  private formatMonthLabel(year: number, month: number): string {
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return `${monthNames[month - 1]} ${year}`;
  }
}

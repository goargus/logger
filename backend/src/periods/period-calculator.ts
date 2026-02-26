import { getCurrentDateString } from '../common/date.utils';

export interface PeriodInfo {
  startDate: string;
  endDate: string;
  periodNumber: number;
  label: string;
}

const SPANISH_MONTHS = [
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

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function buildLabel(year: number, month: number, periodNumber: number): string {
  return `${SPANISH_MONTHS[month - 1]} ${year} - Periodo ${periodNumber}`;
}

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

export class PeriodCalculator {
  constructor(private readonly periodFrequency: number) {}

  computePeriod(dateStr: string): PeriodInfo {
    const { year, month, day } = parseDate(dateStr);
    const periods = this.getPeriodsForMonth(year, month);

    const match = periods.find(
      (p) => day >= parseDate(p.startDate).day && day <= parseDate(p.endDate).day,
    );

    if (!match) {
      throw new Error(`Date ${dateStr} does not fall within any period`);
    }

    return match;
  }

  getCurrentPeriod(): PeriodInfo {
    return this.computePeriod(getCurrentDateString());
  }

  isDateInPastPeriod(dateStr: string): boolean {
    const currentPeriod = this.getCurrentPeriod();
    const targetPeriod = this.computePeriod(dateStr);

    return targetPeriod.endDate < currentPeriod.startDate;
  }

  getPeriodsForMonth(year: number, month: number): PeriodInfo[] {
    const totalDays = daysInMonth(year, month);
    const chunk = Math.floor(totalDays / this.periodFrequency);

    return Array.from({ length: this.periodFrequency }, (_, i) => {
      const periodNum = i + 1;
      const startDay = i * chunk + 1;
      const isLastPeriod = periodNum === this.periodFrequency;
      const endDay = isLastPeriod ? totalDays : periodNum * chunk;

      return {
        startDate: formatDate(year, month, startDay),
        endDate: formatDate(year, month, endDay),
        periodNumber: periodNum,
        label: buildLabel(year, month, periodNum),
      };
    });
  }

  getPreviousPeriods(count: number): PeriodInfo[] {
    const currentPeriod = this.getCurrentPeriod();
    const { year, month } = parseDate(currentPeriod.startDate);
    const periods: PeriodInfo[] = [];

    let curYear = year;
    let curMonth = month;
    let curPeriodNum = currentPeriod.periodNumber;

    for (let i = 0; i < count; i++) {
      curPeriodNum -= 1;
      if (curPeriodNum < 1) {
        curMonth -= 1;
        if (curMonth < 1) {
          curMonth = 12;
          curYear -= 1;
        }
        curPeriodNum = this.periodFrequency;
      }

      const monthPeriods = this.getPeriodsForMonth(curYear, curMonth);
      periods.push(monthPeriods[curPeriodNum - 1]);
    }

    return periods;
  }
}

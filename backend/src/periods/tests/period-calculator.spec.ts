import { PeriodCalculator, PeriodInfo } from '../period-calculator';

describe('PeriodCalculator', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('computePeriod', () => {
    it('returns correct boundaries for frequency=2 in a 31-day month (first half)', () => {
      const calculator = new PeriodCalculator(2);
      const result = calculator.computePeriod('2026-03-10');

      expect(result).toEqual<PeriodInfo>({
        startDate: '2026-03-01',
        endDate: '2026-03-15',
        periodNumber: 1,
        label: 'Marzo 2026 - Período 1',
      });
    });

    it('returns correct second half for frequency=2 in a 31-day month', () => {
      const calculator = new PeriodCalculator(2);
      const result = calculator.computePeriod('2026-03-20');

      expect(result).toEqual<PeriodInfo>({
        startDate: '2026-03-16',
        endDate: '2026-03-31',
        periodNumber: 2,
        label: 'Marzo 2026 - Período 2',
      });
    });

    it('handles February 28 days correctly', () => {
      const calculator = new PeriodCalculator(2);
      // Feb 2026 has 28 days, chunk = floor(28/2) = 14
      const result = calculator.computePeriod('2026-02-20');

      expect(result).toEqual<PeriodInfo>({
        startDate: '2026-02-15',
        endDate: '2026-02-28',
        periodNumber: 2,
        label: 'Febrero 2026 - Período 2',
      });
    });

    it('handles February 29 days in a leap year', () => {
      const calculator = new PeriodCalculator(2);
      // 2028 is a leap year, Feb has 29 days, chunk = floor(29/2) = 14
      const result = calculator.computePeriod('2028-02-29');

      expect(result).toEqual<PeriodInfo>({
        startDate: '2028-02-15',
        endDate: '2028-02-29',
        periodNumber: 2,
        label: 'Febrero 2028 - Período 2',
      });
    });

    it('handles frequency=1 (whole month)', () => {
      const calculator = new PeriodCalculator(1);
      const result = calculator.computePeriod('2026-03-15');

      expect(result).toEqual<PeriodInfo>({
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        periodNumber: 1,
        label: 'Marzo 2026 - Período 1',
      });
    });

    it('handles frequency=3', () => {
      const calculator = new PeriodCalculator(3);
      // March 31 days, chunk = floor(31/3) = 10
      // Period 1: Mar 1-10, Period 2: Mar 11-20, Period 3: Mar 21-31
      const result = calculator.computePeriod('2026-03-25');

      expect(result).toEqual<PeriodInfo>({
        startDate: '2026-03-21',
        endDate: '2026-03-31',
        periodNumber: 3,
        label: 'Marzo 2026 - Período 3',
      });
    });

    it('handles frequency=4', () => {
      const calculator = new PeriodCalculator(4);
      // March 31 days, chunk = floor(31/4) = 7
      // Period 1: Mar 1-7, Period 2: Mar 8-14, Period 3: Mar 15-21, Period 4: Mar 22-31
      const result = calculator.computePeriod('2026-03-25');

      expect(result).toEqual<PeriodInfo>({
        startDate: '2026-03-22',
        endDate: '2026-03-31',
        periodNumber: 4,
        label: 'Marzo 2026 - Período 4',
      });
    });

    it('last period absorbs remainder days', () => {
      const calculator = new PeriodCalculator(4);
      // April has 30 days, chunk = floor(30/4) = 7
      // Period 1: Apr 1-7, Period 2: Apr 8-14, Period 3: Apr 15-21, Period 4: Apr 22-30
      const result = calculator.computePeriod('2026-04-28');

      expect(result).toEqual<PeriodInfo>({
        startDate: '2026-04-22',
        endDate: '2026-04-30',
        periodNumber: 4,
        label: 'Abril 2026 - Período 4',
      });
    });

    it('period boundary - last day of period 1 is in period 1', () => {
      const calculator = new PeriodCalculator(2);
      // March, chunk = floor(31/2) = 15. Period 1: Mar 1-15
      const result = calculator.computePeriod('2026-03-15');

      expect(result.periodNumber).toBe(1);
      expect(result.endDate).toBe('2026-03-15');
    });

    it('period boundary - first day of period 2 is in period 2', () => {
      const calculator = new PeriodCalculator(2);
      // March, chunk = 15. Period 2: Mar 16-31
      const result = calculator.computePeriod('2026-03-16');

      expect(result.periodNumber).toBe(2);
      expect(result.startDate).toBe('2026-03-16');
    });
  });

  describe('getCurrentPeriod', () => {
    it('returns the period containing today', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 2, 10)); // March 10, 2026
      const calculator = new PeriodCalculator(2);
      const result = calculator.getCurrentPeriod();

      expect(result).toEqual<PeriodInfo>({
        startDate: '2026-03-01',
        endDate: '2026-03-15',
        periodNumber: 1,
        label: 'Marzo 2026 - Período 1',
      });
    });
  });

  describe('isDateInPastPeriod', () => {
    it('returns true for a date in a completed period', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 2, 20)); // March 20, 2026
      const calculator = new PeriodCalculator(2);

      // March 5 is in period 1 (Mar 1-15), current is period 2
      expect(calculator.isDateInPastPeriod('2026-03-05')).toBe(true);
    });

    it('returns false for a date in the current period', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 2, 10)); // March 10, 2026
      const calculator = new PeriodCalculator(2);

      // March 5 is in period 1 (Mar 1-15), and we are also in period 1
      expect(calculator.isDateInPastPeriod('2026-03-05')).toBe(false);
    });

    it('returns false for a date in a future period', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 2, 10)); // March 10, 2026
      const calculator = new PeriodCalculator(2);

      // April 5 is in a future period
      expect(calculator.isDateInPastPeriod('2026-04-05')).toBe(false);
    });

    it('returns false on the last day of the current period', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 2, 15)); // March 15, 2026
      const calculator = new PeriodCalculator(2);

      // March 15 is the last day of period 1, and we are on March 15
      expect(calculator.isDateInPastPeriod('2026-03-15')).toBe(false);
    });
  });

  describe('getPeriodsForMonth', () => {
    it('returns all periods for a given month', () => {
      const calculator = new PeriodCalculator(2);
      const periods = calculator.getPeriodsForMonth(2026, 3);

      expect(periods).toHaveLength(2);
      expect(periods[0]).toEqual<PeriodInfo>({
        startDate: '2026-03-01',
        endDate: '2026-03-15',
        periodNumber: 1,
        label: 'Marzo 2026 - Período 1',
      });
      expect(periods[1]).toEqual<PeriodInfo>({
        startDate: '2026-03-16',
        endDate: '2026-03-31',
        periodNumber: 2,
        label: 'Marzo 2026 - Período 2',
      });
    });

    it('returns one period for frequency=1', () => {
      const calculator = new PeriodCalculator(1);
      const periods = calculator.getPeriodsForMonth(2026, 3);

      expect(periods).toHaveLength(1);
      expect(periods[0]).toEqual<PeriodInfo>({
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        periodNumber: 1,
        label: 'Marzo 2026 - Período 1',
      });
    });
  });

  describe('getPreviousPeriods', () => {
    it('returns N previous periods in reverse chronological order', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 2, 20)); // March 20, 2026
      const calculator = new PeriodCalculator(2);
      // Current period: Mar 16-31 (period 2)
      // Previous: Mar 1-15 (period 1), Feb 15-28 (period 2), Feb 1-14 (period 1)
      const periods = calculator.getPreviousPeriods(3);

      expect(periods).toHaveLength(3);
      expect(periods[0]).toEqual<PeriodInfo>({
        startDate: '2026-03-01',
        endDate: '2026-03-15',
        periodNumber: 1,
        label: 'Marzo 2026 - Período 1',
      });
      expect(periods[1]).toEqual<PeriodInfo>({
        startDate: '2026-02-15',
        endDate: '2026-02-28',
        periodNumber: 2,
        label: 'Febrero 2026 - Período 2',
      });
      expect(periods[2]).toEqual<PeriodInfo>({
        startDate: '2026-02-01',
        endDate: '2026-02-14',
        periodNumber: 1,
        label: 'Febrero 2026 - Período 1',
      });
    });

    it('crosses year boundaries', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 0, 10)); // January 10, 2026
      const calculator = new PeriodCalculator(2);
      // Current period: Jan 1-15 (period 1)
      // Previous: Dec 16-31 2025 (period 2), Dec 1-15 2025 (period 1)
      const periods = calculator.getPreviousPeriods(2);

      expect(periods).toHaveLength(2);
      expect(periods[0]).toEqual<PeriodInfo>({
        startDate: '2025-12-16',
        endDate: '2025-12-31',
        periodNumber: 2,
        label: 'Diciembre 2025 - Período 2',
      });
      expect(periods[1]).toEqual<PeriodInfo>({
        startDate: '2025-12-01',
        endDate: '2025-12-15',
        periodNumber: 1,
        label: 'Diciembre 2025 - Período 1',
      });
    });
  });
});

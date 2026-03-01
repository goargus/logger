import { CsvExporter } from './csv-exporter';

describe('CsvExporter', () => {
  let exporter: CsvExporter;

  beforeEach(() => {
    exporter = new CsvExporter();
  });

  describe('escapeValue', () => {
    it('returns empty string for null', () => {
      expect(exporter.escapeValue(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(exporter.escapeValue(undefined)).toBe('');
    });

    it('passes through normal strings unchanged', () => {
      expect(exporter.escapeValue('hello world')).toBe('hello world');
    });

    it('passes through numeric values', () => {
      expect(exporter.escapeValue(42)).toBe('42');
    });

    it('wraps values containing commas in double quotes', () => {
      expect(exporter.escapeValue('foo,bar')).toBe('"foo,bar"');
    });

    it('doubles internal double quotes and wraps', () => {
      expect(exporter.escapeValue('say "hi"')).toBe('"say ""hi"""');
    });

    it('wraps values containing newlines', () => {
      expect(exporter.escapeValue('line1\nline2')).toBe('"line1\nline2"');
    });

    // Formula injection prevention
    it('prepends single quote for values starting with =', () => {
      // Input has quotes → after ' prefix, CSV quoting also applies
      expect(exporter.escapeValue('=CMD("calc")')).toBe('"\'=CMD(""calc"")"');
    });

    it('prepends single quote for simple = formula', () => {
      expect(exporter.escapeValue('=1+1')).toBe("'=1+1");
    });

    it('prepends single quote for values starting with +', () => {
      expect(exporter.escapeValue('+1234')).toBe("'+1234");
    });

    it('prepends single quote for values starting with -', () => {
      expect(exporter.escapeValue('-1234')).toBe("'-1234");
    });

    it('prepends single quote for values starting with @', () => {
      expect(exporter.escapeValue('@SUM(A1)')).toBe("'@SUM(A1)");
    });

    it('prepends single quote for values starting with tab', () => {
      expect(exporter.escapeValue('\tcmd')).toBe("'\tcmd");
    });

    it('prepends single quote for values starting with carriage return', () => {
      // \r triggers both formula prefix and CSV quoting
      expect(exporter.escapeValue('\rcmd')).toBe('"\'\rcmd"');
    });

    it('handles formula char combined with comma (both protections)', () => {
      // Starts with = → gets ' prepended → then has comma → gets quoted
      expect(exporter.escapeValue('=1,2')).toBe("\"'=1,2\"");
    });

    it('does not alter values starting with other special chars', () => {
      expect(exporter.escapeValue('$100')).toBe('$100');
      expect(exporter.escapeValue('#tag')).toBe('#tag');
    });
  });

  describe('exportActivities', () => {
    it('exports empty activity list with just headers', () => {
      const csv = exporter.exportActivities([]);
      const lines = csv.split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Fecha');
      expect(lines[0]).toContain('Descripcion');
    });

    it('exports activities with formula-safe descriptions', () => {
      const activities = [
        {
          activityDate: '2026-03-10',
          user: { full_name: 'Test User', email: 'test@example.com', entity: { name: 'TestOrg' } },
          activityType: { name: 'Meeting' },
          description: '=HYPERLINK("http://evil.com")',
          hasExpense: false,
          expenseAmount: null,
          status: 'submitted',
          createdAt: new Date('2026-03-10T12:00:00Z'),
        },
      ] as any;

      const csv = exporter.exportActivities(activities);
      const lines = csv.split('\n');
      expect(lines).toHaveLength(2);
      // Description should be neutralized with ' prefix
      expect(lines[1]).toContain("'=HYPERLINK");
    });

    it('handles activities with expense amounts', () => {
      const activities = [
        {
          activityDate: '2026-03-10',
          user: { full_name: 'User', email: 'u@e.com', entity: { name: 'Org' } },
          activityType: { name: 'Travel' },
          description: 'Trip',
          hasExpense: true,
          expenseAmount: '150.00',
          status: 'submitted',
          createdAt: new Date('2026-03-10T12:00:00Z'),
        },
      ] as any;

      const csv = exporter.exportActivities(activities);
      expect(csv).toContain('Si');
      expect(csv).toContain('150.00');
    });
  });
});

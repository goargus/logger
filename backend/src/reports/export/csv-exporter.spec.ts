import { CsvExporter } from './csv-exporter';
import { EngagementResponse, SummaryResponse } from '../dto/report-responses.dto';

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

  describe('exportEngagement', () => {
    const mockEngagement: EngagementResponse = {
      summary: {
        totalUsers: 10,
        activeUsers: 7,
        inactiveUsers: 3,
        avgActivitiesPerUser: 4.2,
      },
      users: [
        {
          userId: 'u1',
          name: 'Alice Johnson',
          roles: ['Admin', 'Reporter'],
          entity: 'Field North',
          activityCount: 8,
          lastActivityDate: '2026-02-28',
          trend: 15,
        },
        {
          userId: 'u2',
          name: 'Bob Smith',
          roles: ['Reporter'],
          entity: 'Field South',
          activityCount: 3,
          lastActivityDate: '2026-02-20',
          trend: -5,
        },
        {
          userId: 'u3',
          name: 'Carol Diaz',
          roles: ['Reporter'],
          entity: 'Field North',
          activityCount: 0,
          lastActivityDate: null,
          trend: null,
        },
      ],
    };

    it('includes the report title', () => {
      const csv = exporter.exportEngagement(mockEngagement);
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Reporte de Participacion');
    });

    it('includes summary section with correct values', () => {
      const csv = exporter.exportEngagement(mockEngagement);
      expect(csv).toContain('Resumen');
      expect(csv).toContain('Total Usuarios,10');
      expect(csv).toContain('Usuarios Activos,7');
      expect(csv).toContain('Usuarios Inactivos,3');
      expect(csv).toContain('Promedio Actividades por Usuario,4.2');
    });

    it('includes user detail table with headers', () => {
      const csv = exporter.exportEngagement(mockEngagement);
      expect(csv).toContain('Detalle por Usuario');
      expect(csv).toContain('Nombre,Entidad,Roles,Actividades,Ultima Actividad,Tendencia');
    });

    it('renders user rows with correct data', () => {
      const csv = exporter.exportEngagement(mockEngagement);
      const lines = csv.split('\n');

      // Find Alice's row (first user after header rows)
      const aliceLine = lines.find((l) => l.includes('Alice Johnson'));
      expect(aliceLine).toBeDefined();
      expect(aliceLine).toContain('Alice Johnson');
      expect(aliceLine).toContain('Field North');
      expect(aliceLine).toContain('Admin; Reporter');
      expect(aliceLine).toContain('8');
      expect(aliceLine).toContain('2026-02-28');
      expect(aliceLine).toContain('15%');
    });

    it('renders negative trend with percent sign', () => {
      const csv = exporter.exportEngagement(mockEngagement);
      const bobLine = csv.split('\n').find((l) => l.includes('Bob Smith'));
      expect(bobLine).toBeDefined();
      // trend is rendered as template literal `${user.trend}%`, not via escapeValue
      expect(bobLine).toContain('-5%');
    });

    it('renders null trend and lastActivityDate as empty', () => {
      const csv = exporter.exportEngagement(mockEngagement);
      const carolLine = csv.split('\n').find((l) => l.includes('Carol Diaz'));
      expect(carolLine).toBeDefined();
      // activityCount=0, lastActivityDate='', trend=''
      // The line ends with: 0,,
      expect(carolLine).toMatch(/0,,$/);
    });

    it('omits user table when users array is empty', () => {
      const emptyEngagement: EngagementResponse = {
        summary: { totalUsers: 0, activeUsers: 0, inactiveUsers: 0, avgActivitiesPerUser: 0 },
        users: [],
      };
      const csv = exporter.exportEngagement(emptyEngagement);
      expect(csv).not.toContain('Detalle por Usuario');
      expect(csv).not.toContain('Nombre,Entidad');
    });

    it('escapes user-provided strings for formula injection', () => {
      const malicious: EngagementResponse = {
        summary: { totalUsers: 1, activeUsers: 1, inactiveUsers: 0, avgActivitiesPerUser: 1 },
        users: [
          {
            userId: 'u-evil',
            name: '=CMD("calc")',
            roles: ['+inject'],
            entity: '@SUM(A1)',
            activityCount: 1,
            lastActivityDate: '2026-01-01',
            trend: 0,
          },
        ],
      };

      const csv = exporter.exportEngagement(malicious);
      // name starts with = and contains quotes -> ' prefix + CSV quoting
      expect(csv).toContain("'=CMD");
      // entity starts with @ -> ' prefix
      expect(csv).toContain("'@SUM");
      // role starts with + -> ' prefix
      expect(csv).toContain("'+inject");
    });
  });

  describe('exportSummary', () => {
    const mockSummary: SummaryResponse = {
      period: { id: 'p1', startDate: '2026-02-01', endDate: '2026-02-14', status: 'locked' },
      scope: 'entity',
      entity: { id: 'e1', name: 'Test Entity', type: 'FIELD' },
      totals: {
        activities: 50,
        expenses: 12,
        totalUsers: 10,
        activeUsers: 7,
        activeRate: 0.7,
        avgActivitiesPerUser: 5.0,
      },
    };

    it('includes updated labels for engagement metrics', () => {
      const csv = exporter.exportSummary(mockSummary);
      expect(csv).toContain('Usuarios Activos,7');
      expect(csv).toContain('Total Usuarios,10');
      expect(csv).toContain('Tasa de Participacion,70.0%');
      expect(csv).toContain('Promedio Actividades por Usuario,5');
    });

    it('does not contain old compliance labels', () => {
      const csv = exporter.exportSummary(mockSummary);
      expect(csv).not.toContain('Usuarios que Reportaron');
      expect(csv).not.toContain('Usuarios Esperados');
      expect(csv).not.toContain('Tasa de Cumplimiento');
    });

    it('includes hierarchy breakdown with updated column headers', () => {
      const summaryWithHierarchy: SummaryResponse = {
        ...mockSummary,
        hierarchyBreakdown: [
          {
            entityId: 'e2',
            entityName: 'Sub Entity',
            entityType: 'FIELD',
            parentId: 'e1',
            activities: 20,
            expenses: 5,
            totalUsers: 4,
            activeUsers: 3,
            activeRate: 0.75,
            avgActivitiesPerUser: 5.0,
          },
        ],
      };

      const csv = exporter.exportSummary(summaryWithHierarchy);
      expect(csv).toContain('Desglose por Entidad');
      expect(csv).toContain('Entidad,Tipo,Actividades,Gastos,Usuarios Activos,Participacion');
      expect(csv).toContain('Sub Entity,FIELD,20,5,3,75.0%');
    });
  });
});

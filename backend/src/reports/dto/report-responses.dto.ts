export interface PeriodInfo {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface EntityInfo {
  id: string;
  name: string;
  type: string;
}

export interface SummaryTotals {
  activities: number;
  expenses: number;
  usersExpected: number;
  usersSubmitted: number;
  complianceRate: number;
}

export interface SummaryResponse {
  period: PeriodInfo;
  scope: 'personal' | 'entity';
  entity: EntityInfo;
  totals: SummaryTotals;
}

export interface TypeBreakdown {
  typeId: string;
  name: string;
  count: number;
  expenses: number;
}

export interface EntityBreakdown {
  entityId: string;
  name: string;
  type: string;
  count: number;
  expenses: number;
  compliance: {
    submitted: number;
    total: number;
  };
}

export interface UserBreakdown {
  userId: string;
  name: string;
  count: number;
  expenses: number;
}

export interface BreakdownsResponse {
  byType: TypeBreakdown[];
  byEntity: EntityBreakdown[];
  byUser: UserBreakdown[];
}

export interface SubmittedUser {
  userId: string;
  name: string;
  count: number;
  lastActivity: string;
}

export interface NotSubmittedUser {
  userId: string;
  name: string;
  roles: string[];
  entity: string;
}

export interface ComplianceResponse {
  submitted: SubmittedUser[];
  notSubmitted: NotSubmittedUser[];
}

export interface TrendPeriod {
  periodId: string;
  startDate: string;
  endDate: string;
  activities: number;
  expenses: number;
  complianceRate: number;
  usersSubmitted: number;
  usersExpected: number;
}

export interface TrendsResponse {
  periods: TrendPeriod[];
}

export interface PeriodSummary {
  periodId: string;
  dates: string;
  activities: number;
  expenses: number;
  complianceRate: number;
  usersActive: number;
}

export interface Change {
  value: number;
  percent: number;
}

export interface ComparisonChanges {
  activities: Change;
  expenses: Change;
  complianceRate: Change;
  usersActive: Change;
}

export interface ComparisonResponse {
  current: PeriodSummary;
  previous: PeriodSummary;
  changes: ComparisonChanges;
}

export interface TopPerformer {
  userId: string;
  name: string;
  entity: string;
  count: number;
  expenses: number;
}

export interface LowCompliance {
  entityId: string;
  name: string;
  rate: number;
  missing: number;
}

export interface InactiveUser {
  userId: string;
  name: string;
  entity: string;
  periodsInactive: number;
}

export interface RankingsResponse {
  topPerformers: TopPerformer[];
  lowestCompliance: LowCompliance[];
  inactiveUsers: InactiveUser[];
}

export interface ExpenseByType {
  typeId: string;
  name: string;
  total: number;
  percent: number;
  avgPerActivity: number;
}

export interface ExpenseByEntity {
  entityId: string;
  name: string;
  total: number;
  percent: number;
  perUser: number;
}

export interface ExpenseByUser {
  userId: string;
  name: string;
  total: number;
  percent: number;
}

export interface ExpensesResponse {
  total: number;
  byType: ExpenseByType[];
  byEntity: ExpenseByEntity[];
  byUser: ExpenseByUser[];
}

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
  totalUsers: number;
  activeUsers: number;
  activeRate: number;
  avgActivitiesPerUser: number;
}

export interface HierarchicalEntityBreakdownItem {
  entityId: string;
  entityName: string;
  entityType: string;
  parentId: string | null;
  activities: number;
  expenses: number;
  totalUsers: number;
  activeUsers: number;
  activeRate: number;
  avgActivitiesPerUser: number;
}

export interface SummaryResponse {
  period: PeriodInfo;
  scope: 'personal' | 'entity';
  entity: EntityInfo;
  totals: SummaryTotals;
  hierarchyBreakdown?: HierarchicalEntityBreakdownItem[];
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

export interface EngagementUserItem {
  userId: string;
  name: string;
  roles: string[];
  entity: string;
  activityCount: number;
  lastActivityDate: string | null;
  trend: number | null;
}

export interface EngagementSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  avgActivitiesPerUser: number;
}

export interface EngagementResponse {
  users: EngagementUserItem[];
  summary: EngagementSummary;
}

export interface TrendPeriod {
  periodId: string;
  startDate: string;
  endDate: string;
  activities: number;
  expenses: number;
  activeRate: number;
  activeUsers: number;
  totalUsers: number;
}

export interface TrendsResponse {
  periods: TrendPeriod[];
}

export interface PeriodSummary {
  periodId: string;
  dates: string;
  activities: number;
  expenses: number;
  activeRate: number;
  usersActive: number;
}

export interface Change {
  value: number;
  percent: number;
}

export interface ComparisonChanges {
  activities: Change;
  expenses: Change;
  activeRate: Change;
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

export interface LowEngagement {
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
  lowestEngagement: LowEngagement[];
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

export interface TypeBreakdownChange {
  count: Change;
  expenses: Change;
}

export interface TypeBreakdownWithComparison {
  typeId: string;
  name: string;
  count: number;
  expenses: number;
  previous?: {
    count: number;
    expenses: number;
  };
  change?: TypeBreakdownChange;
  growthDirection: string;
}

export interface BreakdownsComparisonPeriodInfo {
  periodLabel: string;
  dateFrom: string;
  dateTo: string;
}

export interface BreakdownsComparisonTotals {
  current: {
    count: number;
    expenses: number;
  };
  previous?: {
    count: number;
    expenses: number;
  };
  change?: {
    count: Change;
    expenses: Change;
  };
}

export interface BreakdownsComparisonResponse {
  current: BreakdownsComparisonPeriodInfo & {
    byType: TypeBreakdownWithComparison[];
    byEntity: EntityBreakdown[];
    byUser: UserBreakdown[];
  };
  previous?: BreakdownsComparisonPeriodInfo;
  totals: BreakdownsComparisonTotals;
}

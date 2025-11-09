import { Activity } from '../activity.entity';
import { ReportingPeriod } from '../../reporting-periods/reporting-period.entity';

export class ActivityResponseDto {
  id!: string;
  activityTypeId!: string;
  activityTypeName!: string;
  activityDate!: string;
  description?: string | null;
  hasExpense!: boolean;
  expenseAmount?: string | null;
  status!: string;
  locked!: boolean;
  reportingPeriodId?: string | null;
  reportingPeriodName?: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  ownerUserId!: string;
  ownerUsername!: string;

  static fromEntity(
    a: Activity,
    ownerUsername: string,
    activityTypeName: string,
    reportingPeriod: ReportingPeriod | null,
    locked: boolean,
  ): ActivityResponseDto {
    const dto = new ActivityResponseDto();
    dto.id = a.id;
    dto.activityTypeId = a.activityTypeId;
    dto.activityTypeName = activityTypeName;
    dto.activityDate = a.activityDate;
    dto.description = a.description ?? null;
    dto.hasExpense = a.hasExpense;
    dto.expenseAmount = a.expenseAmount ?? null;
    dto.status = a.status;
    dto.locked = locked;
    dto.reportingPeriodId = a.reportingPeriodId ?? null;
    dto.reportingPeriodName = reportingPeriod?.name ?? null;
    dto.createdAt = a.createdAt;
    dto.updatedAt = a.updatedAt;
    dto.ownerUserId = a.userId;
    dto.ownerUsername = ownerUsername;
    return dto;
  }
}

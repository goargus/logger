import { Activity } from '../activity.entity';

export class ActivityResponseDto {
  id!: string;
  activityTypeId!: string;
  activityTypeName!: string;
  activityDate!: string;
  description?: string | null;
  hasExpense!: boolean;
  expenseAmount?: string | null;
  status!: string;
  createdAt!: Date;
  updatedAt!: Date;

  ownerUserId!: string;
  ownerUsername!: string;

  static fromEntity(
    a: Activity,
    ownerUsername: string,
    activityTypeName: string,
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
    dto.createdAt = a.createdAt;
    dto.updatedAt = a.updatedAt;
    dto.ownerUserId = a.userId;
    dto.ownerUsername = ownerUsername;
    return dto;
  }
}

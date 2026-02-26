import { Activity } from '../activity.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityResponseDto {
  @ApiProperty({ description: 'Unique identifier of the activity' })
  id!: string;

  @ApiProperty({ description: 'UUID of the activity type' })
  activityTypeId!: string;

  @ApiProperty({ description: 'Name of the activity type' })
  activityTypeName!: string;

  @ApiProperty({ description: 'Date of the activity', example: '2024-01-15' })
  activityDate!: string;

  @ApiPropertyOptional({ description: 'Description of the activity' })
  description?: string | null;

  @ApiProperty({ description: 'Whether the activity has an expense' })
  hasExpense!: boolean;

  @ApiPropertyOptional({ description: 'Expense amount if applicable' })
  expenseAmount?: string | null;

  @ApiProperty({ description: 'Activity status', example: 'submitted' })
  status!: string;

  @ApiProperty({ description: 'Whether the activity is locked (cannot be modified)' })
  isLocked!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ description: 'UUID of the activity owner' })
  ownerUserId!: string;

  @ApiProperty({ description: 'Username of the activity owner' })
  ownerUsername!: string;

  static fromEntity(
    a: Activity,
    ownerUsername: string,
    activityTypeName: string,
    isLocked: boolean,
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
    dto.isLocked = isLocked;
    dto.createdAt = a.createdAt;
    dto.updatedAt = a.updatedAt;
    dto.ownerUserId = a.userId;
    dto.ownerUsername = ownerUsername;
    return dto;
  }
}

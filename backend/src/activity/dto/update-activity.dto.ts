import { PartialType } from '@nestjs/swagger';
import { CreateActivityDto } from './create-activity.dto';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotFutureActivityDate } from '../validators/is-not-future-activity-date.decorator';

export class UpdateActivityDto extends PartialType(CreateActivityDto) {
  @ApiPropertyOptional({ description: 'UUID of the activity type' })
  @Transform(({ obj }) => obj.activityTypeId ?? obj.activity_type_id)
  @IsOptional()
  @IsUUID()
  activityTypeId?: string;

  @ApiPropertyOptional({ description: 'Date of the activity in ISO 8601 format' })
  @Transform(({ obj }) => obj.activityDate ?? obj.activity_date)
  @IsOptional()
  @IsDateString()
  @IsNotFutureActivityDate({
    message: 'Activity date cannot be in the future',
  })
  activityDate?: string;

  @ApiPropertyOptional({ description: 'Optional description of the activity' })
  @Transform(({ obj }) => obj.description ?? null)
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Whether the activity has an associated expense' })
  @Transform(({ obj }) => obj.hasExpense ?? obj.has_expense)
  @IsOptional()
  hasExpense?: boolean;

  @ApiPropertyOptional({ description: 'Expense amount as a string' })
  @Transform(({ obj }) => obj.expenseAmount ?? obj.expense_amount)
  @IsOptional()
  expenseAmount?: string;
}

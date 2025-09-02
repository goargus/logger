import { PartialType } from '@nestjs/mapped-types';
import { CreateActivityDto } from './create-activity.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateActivityDto extends PartialType(CreateActivityDto) {
  @Transform(({ obj }) => obj.activityTypeId ?? obj.activity_type_id)
  @IsOptional()
  @IsUUID()
  activityTypeId?: string;

  @Transform(({ obj }) => obj.activityDate ?? obj.activity_date)
  @IsOptional()
  activityDate?: string;

  @Transform(({ obj }) => obj.description ?? null)
  @IsOptional()
  description?: string | null;

  @Transform(({ obj }) => obj.hasExpense ?? obj.has_expense)
  @IsOptional()
  hasExpense?: boolean;

  @Transform(({ obj }) => obj.expenseAmount ?? obj.expense_amount)
  @IsOptional()
  expenseAmount?: string;
}

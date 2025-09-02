import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  IsNumberString,
  IsUUID,
  IsNotEmpty,
  IsDefined,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateActivityDto {
  @Transform(({ obj }) => obj.activityTypeId ?? obj.activity_type_id)
  @IsUUID()
  @IsDefined()
  activityTypeId!: string;

  @Transform(({ obj }) => obj.activityDate ?? obj.activity_date)
  @IsDateString()
  @IsDefined()
  activityDate!: string;

  @Transform(({ obj }) => obj.description ?? null)
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @Transform(({ obj }) => obj.hasExpense ?? obj.has_expense ?? false)
  @IsBoolean()
  hasExpense!: boolean;

  @Transform(({ obj }) => obj.expenseAmount ?? obj.expense_amount)
  @ValidateIf((o) => o.hasExpense === true)
  @IsNotEmpty()
  @IsNumberString()
  expenseAmount?: string;
}

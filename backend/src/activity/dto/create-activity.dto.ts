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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty({
    description: 'UUID of the activity type',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Transform(({ obj }) => obj.activityTypeId ?? obj.activity_type_id)
  @IsUUID()
  @IsDefined()
  activityTypeId!: string;

  @ApiProperty({
    description: 'Date of the activity in ISO 8601 format',
    example: '2024-01-15',
  })
  @Transform(({ obj }) => obj.activityDate ?? obj.activity_date)
  @IsDateString()
  @IsDefined()
  activityDate!: string;

  @ApiPropertyOptional({
    description: 'Optional description of the activity',
    maxLength: 5000,
    example: 'Met with team to discuss project timeline',
  })
  @Transform(({ obj }) => obj.description ?? null)
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiProperty({
    description: 'Whether the activity has an associated expense',
    example: false,
    default: false,
  })
  @Transform(({ obj }) => obj.hasExpense ?? obj.has_expense ?? false)
  @IsBoolean()
  hasExpense!: boolean;

  @ApiPropertyOptional({
    description: 'Expense amount as a string (required when hasExpense is true)',
    example: '150.00',
  })
  @Transform(({ obj }) => obj.expenseAmount ?? obj.expense_amount)
  @ValidateIf((o) => o.hasExpense === true)
  @IsNotEmpty()
  @IsNumberString()
  expenseAmount?: string;
}

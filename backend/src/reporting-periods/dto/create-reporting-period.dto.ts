import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { ReportingPeriodStatus } from '../reporting-period-status.enum';

export class CreateReportingPeriodDto {
  @IsNotEmpty()
  @IsUUID()
  entityId!: string;

  @IsNotEmpty()
  @IsUUID()
  termId!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsEnum(ReportingPeriodStatus)
  status?: ReportingPeriodStatus;
}

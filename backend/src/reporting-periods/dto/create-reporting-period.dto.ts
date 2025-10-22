import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ReportingPeriodStatus } from '../reporting-period-status.enum';

export class CreateReportingPeriodDto {
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

import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { ReportingPeriodStatus } from '../reporting-period-status.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportingPeriodDto {
  @ApiProperty({
    description: 'UUID of the entity this reporting period belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  entityId!: string;

  @ApiProperty({
    description: 'Name of the reporting period',
    example: 'January 2024',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Description of the reporting period',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Start date of the reporting period',
    example: '2024-01-01',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'End date of the reporting period',
    example: '2024-01-14',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    description: 'Initial status of the reporting period',
    enum: ReportingPeriodStatus,
    default: ReportingPeriodStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ReportingPeriodStatus)
  status?: ReportingPeriodStatus;
}

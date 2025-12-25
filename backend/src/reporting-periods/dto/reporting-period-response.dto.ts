import { ReportingPeriod } from '../reporting-period.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportingPeriodResponseDto {
  @ApiProperty({ description: 'Unique identifier of the reporting period' })
  id!: string;

  @ApiProperty({ description: 'Name of the reporting period', example: 'January 2024' })
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the reporting period' })
  description?: string | null;

  @ApiProperty({ description: 'Start date of the period', example: '2024-01-01' })
  startDate!: string;

  @ApiProperty({ description: 'End date of the period', example: '2024-01-14' })
  endDate!: string;

  @ApiProperty({ description: 'Current status of the period', example: 'active' })
  status!: string;

  @ApiProperty({ description: 'Whether the period is locked for submissions' })
  isLocked!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  static fromEntity(period: ReportingPeriod): ReportingPeriodResponseDto {
    const dto = new ReportingPeriodResponseDto();
    dto.id = period.id;
    dto.name = period.name;
    dto.description = period.description ?? null;
    dto.startDate = period.startDate;
    dto.endDate = period.endDate;
    dto.status = period.status;
    dto.isLocked = period.isLocked;
    dto.createdAt = period.createdAt;
    dto.updatedAt = period.updatedAt;
    return dto;
  }
}

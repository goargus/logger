import { ReportingPeriodException } from '../reporting-period-exception.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExceptionResponseDto {
  @ApiProperty({ description: 'Unique identifier of the exception' })
  id!: string;

  @ApiProperty({ description: 'UUID of the user who has the exception' })
  userId!: string;

  @ApiProperty({ description: 'Username of the user' })
  username!: string;

  @ApiProperty({ description: 'Email of the user' })
  userEmail!: string;

  @ApiProperty({ description: 'UUID of the reporting period' })
  reportingPeriodId!: string;

  @ApiProperty({ description: 'Start date of the exception', example: '2024-01-15' })
  startDate!: string;

  @ApiProperty({ description: 'End date of the exception', example: '2024-01-20' })
  endDate!: string;

  @ApiPropertyOptional({ description: 'Reason for the exception' })
  reason?: string | null;

  @ApiProperty({ description: 'UUID of the admin who granted the exception' })
  grantedBy!: string;

  @ApiProperty({ description: 'Timestamp when the exception was granted' })
  grantedAt!: Date;

  static fromEntity(
    exception: ReportingPeriodException,
    username: string,
    userEmail: string,
  ): ExceptionResponseDto {
    const dto = new ExceptionResponseDto();
    dto.id = exception.id;
    dto.userId = exception.userId;
    dto.username = username;
    dto.userEmail = userEmail;
    dto.reportingPeriodId = exception.reportingPeriodId;
    dto.startDate = exception.startDate;
    dto.endDate = exception.endDate;
    dto.reason = exception.reason ?? null;
    dto.grantedBy = exception.grantedBy;
    dto.grantedAt = exception.grantedAt;
    return dto;
  }
}

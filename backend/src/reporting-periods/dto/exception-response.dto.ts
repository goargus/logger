import { ReportingPeriodException } from '../reporting-period-exception.entity';

export class ExceptionResponseDto {
  id!: string;
  userId!: string;
  username!: string;
  userEmail!: string;
  reportingPeriodId!: string;
  startDate!: string;
  endDate!: string;
  reason?: string | null;
  grantedBy!: string;
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

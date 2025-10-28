import { ReportingPeriod } from '../reporting-period.entity';

export class ReportingPeriodResponseDto {
  id!: string;
  name!: string;
  description?: string | null;
  startDate!: string;
  endDate!: string;
  status!: string;
  isLocked!: boolean;
  createdAt!: Date;
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

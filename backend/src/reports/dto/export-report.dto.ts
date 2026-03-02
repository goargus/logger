import { IsOptional, IsUUID, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
}

export enum ExportReportType {
  SUMMARY = 'summary',
  ACTIVITIES = 'activities',
  ENGAGEMENT = 'engagement',
}

export class ExportReportQueryDto {
  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    default: ExportFormat.CSV,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat = ExportFormat.CSV;

  @ApiProperty({
    description: 'Type of report to export',
    enum: ExportReportType,
    default: ExportReportType.ACTIVITIES,
  })
  @IsEnum(ExportReportType)
  reportType: ExportReportType = ExportReportType.ACTIVITIES;

  @ApiPropertyOptional({
    description: 'Filter by entity UUID (includes child entities)',
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Start date for date range filter',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date for date range filter',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Include hierarchy breakdown in export',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeHierarchy?: boolean = true;
}

export interface ExportResult {
  data: string | object;
  filename: string;
  contentType: string;
}

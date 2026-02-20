import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReportPeriodType } from '../enums/report-period-type.enum';

export class ReportQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by specific reporting period UUID',
  })
  @IsOptional()
  @IsUUID()
  periodId?: string;

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
    description: 'Filter by entity UUID (includes child entities)',
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific user UUID',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Period type for comparison',
    enum: ReportPeriodType,
  })
  @IsOptional()
  @IsEnum(ReportPeriodType)
  periodType?: ReportPeriodType;

  @ApiPropertyOptional({
    description: 'Year for period selection',
    minimum: 2000,
    maximum: 2100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({
    description: 'Month for monthly period (1-12)',
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({
    description: 'Quarter for quarterly period (1-4)',
    minimum: 1,
    maximum: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  quarter?: number;

  @ApiPropertyOptional({
    description: 'Half for biannual period (1-2)',
    minimum: 1,
    maximum: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  half?: number;

  @ApiPropertyOptional({
    description: 'Include comparison with previous period',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeComparison?: boolean;

  @ApiPropertyOptional({
    description: 'Include per-entity hierarchy breakdown (requires canViewReports permission)',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeHierarchyBreakdown?: boolean;
}

export class RankingsQueryDto extends ReportQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of rankings to return',
    default: 5,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Legacy alias for limit',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topN?: number;
}

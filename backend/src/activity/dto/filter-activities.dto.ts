import { IsOptional, IsUUID, IsDateString, IsIn, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterActivitiesDto {
  @ApiPropertyOptional({
    description: 'Filter activities from this date (inclusive)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value || undefined)
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter activities until this date (inclusive)',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value || undefined)
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by activity type UUID',
  })
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  activityTypeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by expense status',
    enum: ['true', 'false'],
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  @Transform(({ value }) => value || undefined)
  hasExpense?: string;

  @ApiPropertyOptional({
    description: 'Search by activity description or activity type name',
    example: 'discipulado',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim() || undefined)
  search?: string;
}

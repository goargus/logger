import { IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserActivitiesQueryDto {
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
    description: 'Page number (1-indexed)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export interface UserInfoDto {
  id: string;
  name: string;
  email: string;
  entityName: string;
  entityType: string;
  roleName: string;
}

export interface UserActivityDto {
  id: string;
  date: string;
  typeName: string;
  typeId: string;
  description?: string | null;
  hasExpense: boolean;
  expenseAmount?: string | null;
  status: string;
  createdAt: string;
}

export interface UserActivitiesTotalsDto {
  count: number;
  expenses: number;
}

export interface UserActivitiesPaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserActivitiesResponse {
  user: UserInfoDto;
  activities: UserActivityDto[];
  totals: UserActivitiesTotalsDto;
  pagination: UserActivitiesPaginationDto;
}

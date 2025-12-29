import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  IsEnum,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum UsersSortField {
  NAME = 'name',
  EMAIL = 'email',
  ENTITY = 'entity',
  ROLE = 'role',
  ACTIVITIES = 'activities',
  EXPENSES = 'expenses',
  LAST_ACTIVITY = 'lastActivity',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum ComplianceFilter {
  ALL = 'all',
  SUBMITTED = 'submitted',
  NOT_SUBMITTED = 'notSubmitted',
}

export class UsersReportQueryDto {
  @ApiPropertyOptional({ description: 'Filter by entity UUID (includes child entities)' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Start date for date range filter' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date for date range filter' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by reporting period UUID' })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', enum: UsersSortField })
  @IsOptional()
  @IsEnum(UsersSortField)
  sortBy?: UsersSortField = UsersSortField.NAME;

  @ApiPropertyOptional({ description: 'Sort order', enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  @ApiPropertyOptional({ description: 'Filter by compliance status', enum: ComplianceFilter })
  @IsOptional()
  @IsEnum(ComplianceFilter)
  compliance?: ComplianceFilter = ComplianceFilter.ALL;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}

export interface UserRoleAssignmentItem {
  roleId: string;
  roleName: string;
  entityId: string;
  entityName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface UserReportItem {
  userId: string;
  name: string;
  email: string;
  entityId: string;
  entityName: string;
  entityType: string;
  roleId: string;
  roleName: string;
  roleAssignments: UserRoleAssignmentItem[];
  activitiesCount: number;
  totalExpenses: number;
  lastActivityDate: string | null;
  hasSubmitted: boolean;
}

export interface UsersReportResponse {
  users: UserReportItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalUsers: number;
    usersSubmitted: number;
    usersNotSubmitted: number;
    totalActivities: number;
    totalExpenses: number;
  };
}

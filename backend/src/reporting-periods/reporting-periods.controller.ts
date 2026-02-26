import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportingPeriodsService } from './reporting-periods.service';
import { CreateReportingPeriodDto } from './dto/create-reporting-period.dto';
import { UpdateReportingPeriodDto } from './dto/update-reporting-period.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { ReportingPeriodResponseDto } from './dto/reporting-period-response.dto';
import { ExceptionResponseDto } from './dto/exception-response.dto';
import { ListReportingPeriodsQueryDto } from './dto/list-reporting-periods.dto';
import { PaginationMeta } from '../common/pagination';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Request } from 'express';

@ApiTags('Reporting Periods')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reporting-periods')
export class ReportingPeriodsController {
  constructor(
    private readonly reportingPeriodsService: ReportingPeriodsService,
    private readonly identity: IdentityResolutionService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  @Post('admin')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new reporting period (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Reporting period created',
    type: ReportingPeriodResponseDto,
  })
  async create(
    @Req() req: Request,
    @Body() dto: CreateReportingPeriodDto,
  ): Promise<ReportingPeriodResponseDto> {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const created = await this.reportingPeriodsService.create(dto, user.id);
    return ReportingPeriodResponseDto.fromEntity(created);
  }

  @Get()
  @ApiOperation({ summary: 'List all reporting periods' })
  @ApiResponse({
    status: 200,
    description: 'List of reporting periods',
  })
  async findAll(
    @Query() query: ListReportingPeriodsQueryDto,
  ): Promise<{
    data: ReportingPeriodResponseDto[];
    pagination: PaginationMeta;
  }> {
    const result = await this.reportingPeriodsService.findAll(query);
    return {
      data: result.data.map((period) => ReportingPeriodResponseDto.fromEntity(period)),
      pagination: result.pagination,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single reporting period by ID' })
  @ApiResponse({
    status: 200,
    description: 'Reporting period details',
    type: ReportingPeriodResponseDto,
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ReportingPeriodResponseDto> {
    const period = await this.reportingPeriodsService.findOne(id);
    return ReportingPeriodResponseDto.fromEntity(period);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a reporting period (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Reporting period updated',
    type: ReportingPeriodResponseDto,
  })
  async update(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReportingPeriodDto,
  ): Promise<ReportingPeriodResponseDto> {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const updated = await this.reportingPeriodsService.update(id, dto, user.id);
    return ReportingPeriodResponseDto.fromEntity(updated);
  }

  @Patch(':id/lock')
  @Roles('admin')
  @ApiOperation({ summary: 'Lock a reporting period (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Reporting period locked',
    type: ReportingPeriodResponseDto,
  })
  async lock(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ReportingPeriodResponseDto> {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const locked = await this.reportingPeriodsService.lock(id, user.id);
    return ReportingPeriodResponseDto.fromEntity(locked);
  }

  @Patch(':id/unlock')
  @Roles('admin')
  @ApiOperation({ summary: 'Unlock a reporting period (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Reporting period unlocked',
    type: ReportingPeriodResponseDto,
  })
  async unlock(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ReportingPeriodResponseDto> {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const unlocked = await this.reportingPeriodsService.unlock(id, user.id);
    return ReportingPeriodResponseDto.fromEntity(unlocked);
  }

  @Patch(':id/close')
  @Roles('admin')
  @ApiOperation({ summary: 'Close a reporting period (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Reporting period closed',
    type: ReportingPeriodResponseDto,
  })
  async close(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ReportingPeriodResponseDto> {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const closed = await this.reportingPeriodsService.close(id, user.id);
    return ReportingPeriodResponseDto.fromEntity(closed);
  }

  @Post(':periodId/exceptions')
  @Roles('admin')
  @ApiOperation({ summary: 'Create or update an exception for a user (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Exception created/updated',
    type: ExceptionResponseDto,
  })
  async createException(
    @Req() req: Request,
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
    @Body() dto: CreateExceptionDto,
  ): Promise<ExceptionResponseDto> {
    const { sub, iss } = (req.user as any) ?? {};
    const admin = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const exception = await this.reportingPeriodsService.createOrUpdateException(
      periodId,
      dto,
      admin.id,
    );

    const user = await this.usersRepo.findOneByOrFail({ id: exception.userId });
    return ExceptionResponseDto.fromEntity(exception, user.username, user.email);
  }

  @Delete(':periodId/exceptions/:userId')
  @Roles('admin')
  @ApiOperation({ summary: 'Revoke an exception for a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Exception revoked' })
  async revokeException(
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<{ ok: boolean }> {
    await this.reportingPeriodsService.revokeException(periodId, userId);
    return { ok: true };
  }

  @Get(':periodId/exceptions')
  @Roles('admin')
  @ApiOperation({ summary: 'List all exceptions for a reporting period (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of exceptions', type: [ExceptionResponseDto] })
  async listExceptions(
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
  ): Promise<ExceptionResponseDto[]> {
    const exceptions = await this.reportingPeriodsService.findExceptionsByPeriod(periodId);
    return exceptions.map((ex) =>
      ExceptionResponseDto.fromEntity(ex, ex.user.username, ex.user.email),
    );
  }

  @Get('locked-dates/ranges')
  @ApiOperation({ summary: 'Get locked date ranges for the current user' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of locked date ranges (dates where user cannot create activities)',
    schema: {
      type: 'object',
      properties: {
        lockedRanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startDate: { type: 'string', format: 'date', example: '2024-01-01' },
              endDate: { type: 'string', format: 'date', example: '2024-01-31' },
              periodName: { type: 'string', example: 'January 2024' },
            },
          },
        },
      },
    },
  })
  async getLockedDateRanges(@Req() req: Request): Promise<{
    lockedRanges: Array<{ startDate: string; endDate: string; periodName: string }>;
  }> {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const lockedRanges = await this.reportingPeriodsService.getLockedDateRangesForUser(user.id);
    return { lockedRanges };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a reporting period (Admin only)' })
  @ApiResponse({ status: 200, description: 'Reporting period deleted' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<{ ok: boolean }> {
    await this.reportingPeriodsService.remove(id);
    return { ok: true };
  }
}

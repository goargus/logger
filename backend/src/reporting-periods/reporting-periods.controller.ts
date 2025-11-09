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
import { ReportingPeriodsService } from './reporting-periods.service';
import { CreateReportingPeriodDto } from './dto/create-reporting-period.dto';
import { UpdateReportingPeriodDto } from './dto/update-reporting-period.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { ReportingPeriodResponseDto } from './dto/reporting-period-response.dto';
import { ExceptionResponseDto } from './dto/exception-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Request } from 'express';

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
  async findAll(
    @Query('entityId') entityId?: string,
    @Query('termId') termId?: string,
  ): Promise<ReportingPeriodResponseDto[]> {
    const periods = await this.reportingPeriodsService.findAll(entityId, termId);
    return periods.map((period) => ReportingPeriodResponseDto.fromEntity(period));
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<ReportingPeriodResponseDto> {
    const period = await this.reportingPeriodsService.findOne(id);
    return ReportingPeriodResponseDto.fromEntity(period);
  }

  @Patch(':id')
  @Roles('admin')
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
  async revokeException(
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<{ ok: boolean }> {
    await this.reportingPeriodsService.revokeException(periodId, userId);
    return { ok: true };
  }

  @Get(':periodId/exceptions')
  @Roles('admin')
  async listExceptions(
    @Param('periodId', new ParseUUIDPipe()) periodId: string,
  ): Promise<ExceptionResponseDto[]> {
    const exceptions = await this.reportingPeriodsService.findExceptionsByPeriod(periodId);
    return exceptions.map((ex) =>
      ExceptionResponseDto.fromEntity(ex, ex.user.username, ex.user.email),
    );
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<{ ok: boolean }> {
    await this.reportingPeriodsService.remove(id);
    return { ok: true };
  }
}

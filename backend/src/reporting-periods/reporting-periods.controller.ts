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
} from '@nestjs/common';
import { ReportingPeriodsService } from './reporting-periods.service';
import { CreateReportingPeriodDto } from './dto/create-reporting-period.dto';
import { UpdateReportingPeriodDto } from './dto/update-reporting-period.dto';
import { ReportingPeriodResponseDto } from './dto/reporting-period-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reporting-periods')
export class ReportingPeriodsController {
  constructor(
    private readonly reportingPeriodsService: ReportingPeriodsService,
    private readonly identity: IdentityResolutionService,
  ) {}

  @Post()
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
  async findAll(): Promise<ReportingPeriodResponseDto[]> {
    const periods = await this.reportingPeriodsService.findAll();
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

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<{ ok: boolean }> {
    await this.reportingPeriodsService.remove(id);
    return { ok: true };
  }
}

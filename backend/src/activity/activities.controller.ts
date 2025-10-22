import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { ActivityResponseDto } from './dto/activity-response.dto';
import { Request } from 'express';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { ActivityType } from '../activities-type/activity-type.entity';
import { ReportingPeriod } from '../reporting-periods/reporting-period.entity';

@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activities: ActivitiesService,
    private readonly identity: IdentityResolutionService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(ActivityType) private readonly typesRepo: Repository<ActivityType>,
    @InjectRepository(ReportingPeriod)
    private readonly reportingPeriodsRepo: Repository<ReportingPeriod>,
  ) {}

  private async getReportingPeriodForActivity(activity: any): Promise<ReportingPeriod | null> {
    if (!activity.reportingPeriodId) return null;
    return this.reportingPeriodsRepo.findOne({ where: { id: activity.reportingPeriodId } });
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateActivityDto): Promise<ActivityResponseDto> {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const created = await this.activities.create(dto, user.id);

    const [owner, type, reportingPeriod] = await Promise.all([
      this.usersRepo.findOneByOrFail({ id: created.userId }),
      this.typesRepo.findOneByOrFail({ id: created.activityTypeId }),
      this.getReportingPeriodForActivity(created),
    ]);

    return ActivityResponseDto.fromEntity(
      created,
      owner.username,
      (type as any).name,
      reportingPeriod,
    );
  }

  @Get()
  async findMine(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const [items, total] = await this.activities.findMine(user.id, page, limit);

    const [owner, typesMap, reportingPeriodsMap] = await Promise.all([
      this.usersRepo.findOneByOrFail({ id: user.id }),
      (async () => {
        const ids = [...new Set(items.map((i) => i.activityTypeId))];
        if (!ids.length) return new Map<string, string>();
        const types = await this.typesRepo.find({ where: { id: In(ids) } });
        return new Map(types.map((t) => [t.id, (t as any).name]));
      })(),
      (async () => {
        const ids = [...new Set(items.map((i) => i.reportingPeriodId).filter(Boolean))];
        if (!ids.length) return new Map<string, ReportingPeriod>();
        const periods = await this.reportingPeriodsRepo.find({ where: { id: In(ids) } });
        return new Map(periods.map((p) => [p.id, p]));
      })(),
    ]);

    return {
      page,
      limit,
      total,
      items: items.map((a) =>
        ActivityResponseDto.fromEntity(
          a,
          owner.username,
          typesMap.get(a.activityTypeId) ?? '',
          reportingPeriodsMap.get(a.reportingPeriodId || '') ?? null,
        ),
      ),
    };
  }

  @Get(':id')
  async getOne(@Req() req: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const a = await this.activities.findOneMine(id, user.id);
    const [owner, type, reportingPeriod] = await Promise.all([
      this.usersRepo.findOneByOrFail({ id: a.userId }),
      this.typesRepo.findOneByOrFail({ id: a.activityTypeId }),
      this.getReportingPeriodForActivity(a),
    ]);
    return ActivityResponseDto.fromEntity(a, owner.username, (type as any).name, reportingPeriod);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const updated = await this.activities.updateMine(id, dto, user.id);
    const [owner, type, reportingPeriod] = await Promise.all([
      this.usersRepo.findOneByOrFail({ id: updated.userId }),
      this.typesRepo.findOneByOrFail({ id: updated.activityTypeId }),
      this.getReportingPeriodForActivity(updated),
    ]);
    return ActivityResponseDto.fromEntity(
      updated,
      owner.username,
      (type as any).name,
      reportingPeriod,
    );
  }

  @Delete(':id')
  async archive(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('confirm') confirm?: string,
  ) {
    if (confirm !== 'true') {
      throw new BadRequestException('Deletion requires confirm=true.');
    }
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    await this.activities.archiveMine(id, user.id);
    return { ok: true };
  }

  @Get('stats/monthly-expenses')
  async getMonthlyExpenses(
    @Req() req: Request,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number,
    @Query('month', new DefaultValuePipe(new Date().getMonth() + 1), ParseIntPipe) month: number,
  ) {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const total = await this.activities.getMonthlyExpenseTotal(user.id, year, month);
    return { total, year, month };
  }
}

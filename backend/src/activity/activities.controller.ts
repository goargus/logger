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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { ActivityResponseDto } from './dto/activity-response.dto';
import { buildPagination } from '../common/pagination';
import { Request } from 'express';
import { In } from 'typeorm';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { ActivityType } from '../activities-type/activity-type.entity';
import { LockService } from '../periods/lock.service';

@ApiTags('Activities')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activities: ActivitiesService,
    private readonly identity: IdentityResolutionService,
    private readonly lockService: LockService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(ActivityType) private readonly typesRepo: Repository<ActivityType>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new activity' })
  @ApiResponse({
    status: 201,
    description: 'Activity created successfully',
    type: ActivityResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Req() req: Request, @Body() dto: CreateActivityDto): Promise<ActivityResponseDto> {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const created = await this.activities.create(dto, user.id);

    const [owner, type, adminLock] = await Promise.all([
      this.usersRepo.findOneByOrFail({ id: created.userId }),
      this.typesRepo.findOneByOrFail({ id: created.activityTypeId }),
      this.lockService.getAdminLock(user.entity_id),
    ]);

    const isLocked = this.lockService.isDateLockedSync(created.activityDate, adminLock);

    return ActivityResponseDto.fromEntity(created, owner.username, (type as any).name, isLocked);
  }

  @Get()
  @ApiOperation({ summary: 'List my activities with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of activities' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter until date (YYYY-MM-DD)' })
  @ApiQuery({
    name: 'activityTypeId',
    required: false,
    description: 'Filter by activity type UUID',
  })
  @ApiQuery({
    name: 'hasExpense',
    required: false,
    enum: ['true', 'false'],
    description: 'Filter by expense status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by description or activity type name',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['activityDate', 'activityType', 'description', 'expenseAmount'],
    description: 'Column to sort by (default: activityDate)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort direction (default: DESC)',
  })
  async findMine(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('activityTypeId') activityTypeId?: string,
    @Query('hasExpense') hasExpense?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const filters = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      activityTypeId: activityTypeId || undefined,
      hasExpense: hasExpense === 'true' ? true : hasExpense === 'false' ? false : undefined,
      search: search?.trim() || undefined,
      sortBy: sortBy || undefined,
      sortOrder: (sortOrder === 'ASC' ? 'ASC' : sortOrder === 'DESC' ? 'DESC' : undefined) as
        | 'ASC'
        | 'DESC'
        | undefined,
    };

    const [items, total] = await this.activities.findMine(user.id, page, limit, filters);

    const [owner, typesMap, adminLock] = await Promise.all([
      this.usersRepo.findOneByOrFail({ id: user.id }),
      (async () => {
        const ids = [...new Set(items.map((i) => i.activityTypeId))];
        if (!ids.length) return new Map<string, string>();
        const types = await this.typesRepo.find({ where: { id: In(ids) } });
        return new Map(types.map((t) => [t.id, (t as any).name]));
      })(),
      this.lockService.getAdminLock(user.entity_id),
    ]);

    const data = items.map((a) => {
      const isLocked = this.lockService.isDateLockedSync(a.activityDate, adminLock);
      return ActivityResponseDto.fromEntity(
        a,
        owner.username,
        typesMap.get(a.activityTypeId) ?? '',
        isLocked,
      );
    });

    return {
      data,
      pagination: buildPagination(page, limit, total),
    };
  }

  @Get('stats/monthly-expenses')
  @ApiOperation({ summary: 'Get monthly expense total for the current user' })
  @ApiResponse({ status: 200, description: 'Monthly expense total' })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Year (default: current year)',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Month 1-12 (default: current month)',
  })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get a single activity by ID' })
  @ApiResponse({ status: 200, description: 'Activity details', type: ActivityResponseDto })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async getOne(@Req() req: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const a = await this.activities.findOneMine(id, user.id);
    const [owner, type, adminLock] = await Promise.all([
      this.usersRepo.findOneByOrFail({ id: a.userId }),
      this.typesRepo.findOneByOrFail({ id: a.activityTypeId }),
      this.lockService.getAdminLock(user.entity_id),
    ]);

    const isLocked = this.lockService.isDateLockedSync(a.activityDate, adminLock);

    return ActivityResponseDto.fromEntity(a, owner.username, (type as any).name, isLocked);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an activity' })
  @ApiResponse({
    status: 200,
    description: 'Activity updated successfully',
    type: ActivityResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiResponse({ status: 403, description: 'Activity is locked and cannot be modified' })
  async update(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    const updated = await this.activities.updateMine(id, dto, user.id);
    const [owner, type, adminLock] = await Promise.all([
      this.usersRepo.findOneByOrFail({ id: updated.userId }),
      this.typesRepo.findOneByOrFail({ id: updated.activityTypeId }),
      this.lockService.getAdminLock(user.entity_id),
    ]);

    const isLocked = this.lockService.isDateLockedSync(updated.activityDate, adminLock);

    return ActivityResponseDto.fromEntity(updated, owner.username, (type as any).name, isLocked);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive (soft delete) an activity' })
  @ApiResponse({ status: 200, description: 'Activity archived successfully' })
  @ApiResponse({ status: 400, description: 'Confirmation required (confirm=true)' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiQuery({ name: 'confirm', required: true, description: 'Must be "true" to confirm deletion' })
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
}

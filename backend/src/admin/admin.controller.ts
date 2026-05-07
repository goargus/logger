import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivitiesService } from '../activity/activities.service';
import { CreateAdminActivityDto } from './dto/create-admin-activity.dto';
import { ActivityResponseDto } from '../activity/dto/activity-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { ActivityType } from '../activities-type/activity-type.entity';
import { Repository } from 'typeorm';
import { LockService } from '../periods/lock.service';
import { Request } from 'express';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly lockService: LockService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(ActivityType) private readonly typesRepo: Repository<ActivityType>,
  ) {}

  @Get('dashboard')
  @Roles('read:admin_dashboard')
  @ApiOperation({ summary: 'Get admin dashboard' })
  @ApiResponse({ status: 200, description: 'Welcome message for admin' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin permission' })
  getDashboard() {
    return { message: 'Welcome Admin' };
  }

  @Post('activities')
  @Roles('admin')
  @ApiOperation({ summary: 'Create an activity for another user (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Activity created successfully for the target user',
    type: ActivityResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin permission' })
  async createActivityForUser(
    @Req() req: Request,
    @Body() dto: CreateAdminActivityDto,
  ): Promise<ActivityResponseDto> {
    const adminUserId = (req.user as any)?.id;
    const created = await this.activitiesService.createForUserByAdmin(dto, adminUserId);

    const [owner, type] = await Promise.all([
      this.usersRepo.findOneByOrFail({ id: created.userId }),
      this.typesRepo.findOneByOrFail({ id: created.activityTypeId }),
    ]);

    const adminLock = await this.lockService.getAdminLock(owner.entity_id);
    const isLocked = this.lockService.isDateLockedSync(created.activityDate, adminLock);

    return ActivityResponseDto.fromEntity(created, owner.username, (type as any).name, isLocked);
  }
}

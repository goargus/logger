import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Query,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { LockService, AvailabilityResponse } from './lock.service';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { SetAdminLockDto } from './dto/set-admin-lock.dto';
import { GrantExceptionDto } from './dto/grant-exception.dto';
import { Request } from 'express';

@ApiTags('Periods')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('periods')
export class PeriodsController {
  constructor(
    private readonly lockService: LockService,
    private readonly identity: IdentityResolutionService,
  ) {}

  @Get('availability')
  @ApiOperation({ summary: 'Get date availability for a month' })
  async getAvailability(
    @Req() req: Request,
    @Query('month') month: string,
  ): Promise<AvailabilityResponse> {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new BadRequestException('month must be in YYYY-MM format');
    }

    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    return this.lockService.getAvailability(user.entity_id, user.id, month);
  }

  @Patch('admin-lock')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Set admin lock date for an entity' })
  async setAdminLock(@Req() req: Request, @Body() dto: SetAdminLockDto) {
    const { sub, iss } = (req.user as any) ?? {};
    const user = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    return this.lockService.setAdminLock(dto.entityId, dto.lockDate, user.id);
  }

  @Delete('admin-lock/:entityId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Remove admin lock for an entity' })
  async removeAdminLock(@Param('entityId', new ParseUUIDPipe()) entityId: string) {
    await this.lockService.removeAdminLock(entityId);
    return { ok: true };
  }

  @Post('exceptions')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Grant a date exception to a user' })
  async grantException(@Req() req: Request, @Body() dto: GrantExceptionDto) {
    const { sub, iss } = (req.user as any) ?? {};
    const admin = await this.identity.resolveUserBySubAndIssuer(sub, iss);

    return this.lockService.grantException(
      dto.userId,
      dto.entityId,
      dto.startDate,
      dto.endDate,
      admin.id,
      dto.reason,
    );
  }

  @Delete('exceptions/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Revoke a date exception' })
  async revokeException(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.lockService.revokeException(id);
    return { ok: true };
  }
}

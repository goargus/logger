import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityTypesService } from './activity-types.service';
import { CreateActivityTypeDto } from './dto/create-activity-type.dto';
import { UpdateActivityTypeDto } from './dto/update-activity-type.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { Request } from 'express';
import { JwtValidatedUser } from '../auth/jwt.strategy';

@ApiTags('Activity Types')
@Controller('activity-types')
export class ActivityTypesController {
  constructor(
    private readonly service: ActivityTypesService,
    private readonly identityService: IdentityResolutionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all activity types' })
  @ApiResponse({ status: 200, description: 'List of all activity types' })
  async list() {
    return this.service.findAll();
  }

  @Get('authorized')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List activity types authorized for current user' })
  @ApiResponse({ status: 200, description: 'List of authorized activity types' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAuthorized(@Req() req: Request) {
    const { sub, iss } = (req.user as JwtValidatedUser) ?? {};
    const user = await this.identityService.resolveUserBySubAndIssuer(sub, iss);
    return this.service.findAllByUserRoleAssignments(user.id);
  }

  @Get('user-roles/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user role assignments' })
  @ApiResponse({ status: 200, description: 'List of user role assignments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyRoleAssignments(@Req() req: Request) {
    const { sub, iss } = (req.user as JwtValidatedUser) ?? {};
    const user = await this.identityService.resolveUserBySubAndIssuer(sub, iss);
    return this.service.getUserRoleAssignments(user.id);
  }

  @Get('by-role/:roleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List activity types by specific role' })
  @ApiResponse({ status: 200, description: 'List of activity types for the role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getByRole(@Param('roleId', new ParseUUIDPipe()) roleId: string) {
    return this.service.findAllByUserRole(roleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single activity type by ID' })
  @ApiResponse({ status: 200, description: 'Activity type details' })
  @ApiResponse({ status: 404, description: 'Activity type not found' })
  async getOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new activity type (Admin only)' })
  @ApiResponse({ status: 201, description: 'Activity type created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async create(@Body() dto: CreateActivityTypeDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an activity type (Admin only)' })
  @ApiResponse({ status: 200, description: 'Activity type updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Activity type not found' })
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateActivityTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an activity type (Admin only)' })
  @ApiResponse({ status: 200, description: 'Activity type deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Activity type not found' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.remove(id);
    return { message: 'Activity type deleted.' };
  }
}

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
import { ActivityTypesService } from './activity-types.service';
import { CreateActivityTypeDto } from './dto/create-activity-type.dto';
import { UpdateActivityTypeDto } from './dto/update-activity-type.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { Request } from 'express';
import { JwtValidatedUser } from '../auth/jwt.strategy';

@Controller('activity-types')
export class ActivityTypesController {
  constructor(
    private readonly service: ActivityTypesService,
    private readonly identityService: IdentityResolutionService,
  ) {}

  @Get()
  async list() {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('authorized')
  async getAuthorized(@Req() req: Request) {
    const { sub, iss } = (req.user as JwtValidatedUser) ?? {};
    const user = await this.identityService.resolveUserBySubAndIssuer(sub, iss);
    return this.service.findAllByUserRole(user.role_id);
  }

  @Get(':id')
  async getOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() dto: CreateActivityTypeDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateActivityTypeDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.service.remove(id);
    return { message: 'Activity type deleted.' };
  }
}

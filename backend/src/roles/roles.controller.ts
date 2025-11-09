import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleAssignmentService } from './role-assignment.service';
import { AssignRoleDto, RoleEnum } from './dto/assign-role.dto';
import { RemoveRoleDto } from './dto/remove-role.dto';
import { BulkAssignRoleDto } from './dto/bulk-assign-role.dto';
import { GetUserEntitiesByRoleDto } from './dto/get-user-entities-by-role.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { AssignmentResponseDto } from './dto/assignment-response.dto';

@Controller('roles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly roleAssignment: RoleAssignmentService,
  ) {}

  @Get('users-by-role')
  @Roles('admin')
  usersByRole(@Query('role') role: string) {
    const normalized = String(role).trim();
    return this.roleAssignment.listUsersByRole(normalized);
  }

  @Get('users-by-entity/:entityId')
  @Roles('admin')
  usersByEntity(@Param('entityId', new ParseUUIDPipe({ version: '4' })) entityId: string) {
    return this.roleAssignment.listUsersByEntity(entityId);
  }

  @Post('assign')
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  assign(@Body() dto: AssignRoleDto) {
    return this.roleAssignment.assign(dto);
  }

  @Delete('assign')
  @Roles('admin')
  removeAssignment(@Body() dto: RemoveRoleDto) {
    return this.roleAssignment.remove(dto);
  }

  @Post('assign/bulk')
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  bulkAssign(@Body() dto: BulkAssignRoleDto) {
    return this.roleAssignment.bulkAssign(dto);
  }

  @Get('user-entities-by-role')
  @Roles('admin')
  @UsePipes(new ValidationPipe({ transform: true }))
  getUserEntitiesByRole(@Query() dto: GetUserEntitiesByRoleDto) {
    return this.roleAssignment.getUserEntitiesByRole(dto);
  }

  @Get('user-assignments/:userId')
  @Roles('admin')
  getUserAssignments(@Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string) {
    return this.roleAssignment.listAssignmentsForUser(userId);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('id/:id')
  @Roles('admin')
  getRoleById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.rolesService.remove(id);
  }

  @Get('assignments')
  @Roles('admin')
  async listAssignments(
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('active') active?: string,
  ) {
    const activeFilter = active === 'true' ? true : active === 'false' ? false : undefined;
    const assignments = await this.roleAssignment.listAssignments(
      entityId,
      userId,
      activeFilter,
    );
    return assignments.map((a) => AssignmentResponseDto.fromEntity(a));
  }

  @Get('assignments/:id')
  @Roles('admin')
  async getAssignment(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const assignment = await this.roleAssignment.getAssignment(id);
    return AssignmentResponseDto.fromEntity(assignment);
  }

  @Patch('assignments/:id')
  @Roles('admin')
  async updateAssignment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    const assignment = await this.roleAssignment.updateAssignment(id, dto.endDate);
    return AssignmentResponseDto.fromEntity(assignment);
  }

  @Delete('assignments/:id')
  @Roles('admin')
  deleteAssignment(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.roleAssignment.deleteAssignment(id);
  }
}

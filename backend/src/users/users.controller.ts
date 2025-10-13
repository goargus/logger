import { Controller, Post, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { Request } from 'express';
import { JwtValidatedUser } from '../auth/jwt.strategy';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly identityService: IdentityResolutionService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: Request) {
    const { sub, iss } = (req.user as JwtValidatedUser) ?? {};
    const user = await this.identityService.resolveUserBySubAndIssuer(sub, iss);
    const profile = await this.usersService.findUserProfile(user.id);
    return {
      id: profile.user.id,
      username: profile.user.username,
      email: profile.user.email,
      full_name: profile.user.full_name,
      first_name: profile.user.first_name,
      family_name: profile.user.family_name,
      status: profile.user.status,
      created_at: profile.user.created_at,
      updated_at: profile.user.updated_at,
      primary_role: {
        id: profile.user.role.id,
        name: profile.user.role.name,
        description: profile.user.role.description,
      },
      primary_entity: {
        id: profile.user.entity.id,
        name: profile.user.entity.name,
        description: profile.user.entity.description,
        type: profile.user.entity.type,
        parent_id: profile.user.entity.parent_id,
      },
      role_assignments: profile.roleAssignments.map((assignment) => ({
        id: assignment.id,
        role: {
          id: assignment.role.id,
          name: assignment.role.name,
          description: assignment.role.description,
        },
        entity: {
          id: assignment.entity.id,
          name: assignment.entity.name,
          description: assignment.entity.description,
          type: assignment.entity.type,
          parent_id: assignment.entity.parent_id,
        },
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
      })),
    };
  }
}

@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return { message: 'User created successfully', user };
  }

  @Get()
  async list() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(id, dto);
    return { message: 'User updated successfully', user };
  }
}

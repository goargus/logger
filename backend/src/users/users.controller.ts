import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { Request } from 'express';
import { JwtValidatedUser } from '../auth/jwt.strategy';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly identityService: IdentityResolutionService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile with role assignments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

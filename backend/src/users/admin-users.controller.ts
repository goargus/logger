import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('Admin Users')
@ApiBearerAuth('JWT-auth')
@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return { message: 'User created successfully', user };
  }

  @Get()
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async list(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(id, dto);
    return { message: 'User updated successfully', user };
  }
}

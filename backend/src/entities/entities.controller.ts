import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action, AppAbility } from '../casl/types';
import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { EntityType, Entity } from './entity.entity';

@ApiTags('Entities')
@ApiBearerAuth('JWT-auth')
@Controller('entities')
@UseGuards(AuthGuard('jwt'), PoliciesGuard)
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  private parseType(typeStr: string): EntityType {
    const upper = (typeStr || '').toUpperCase();
    const allowed = Object.values(EntityType) as string[];
    if (!allowed.includes(upper)) {
      throw new BadRequestException(`Invalid type. Allowed: ${allowed.join(', ')}`);
    }
    return upper as EntityType;
  }

  @Post(':type')
  @CheckPolicies((ability) => ability.can(Action.Create, Entity))
  @ApiOperation({ summary: 'Create an entity of specified type' })
  @ApiParam({ name: 'type', enum: ['PLATFORM', 'UNION', 'ASSOCIATION', 'FIELD'] })
  @ApiResponse({ status: 201, description: 'Entity created successfully' })
  async createAny(@Param('type') typeStr: string, @Body() dto: CreateEntityDto) {
    const type = this.parseType(typeStr);
    try {
      return await this.entitiesService.create({ ...dto, type });
    } catch (e: any) {
      if (e?.code === '23505') {
        throw new ConflictException(`An entity with this name already exists for type ${type}`);
      }
      throw e;
    }
  }

  @Get()
  @ApiOperation({ summary: 'List all entities' })
  @ApiResponse({ status: 200, description: 'List of all entities' })
  async findAll() {
    return this.entitiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single entity by ID' })
  @ApiResponse({ status: 200, description: 'Entity details' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.entitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an entity' })
  @ApiResponse({ status: 200, description: 'Entity updated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async update(
    @Req() req: Request,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEntityDto,
  ) {
    const entity = await this.entitiesService.findOne(id);
    const ability = (req as any).ability as AppAbility;

    if (!ability.can(Action.Update, entity)) {
      throw new ForbiddenException('You do not have permission to update this entity');
    }

    return this.entitiesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an entity' })
  @ApiResponse({ status: 200, description: 'Entity deleted' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async remove(@Req() req: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    const entity = await this.entitiesService.findOne(id);
    const ability = (req as any).ability as AppAbility;

    if (!ability.can(Action.Delete, entity)) {
      throw new ForbiddenException('You do not have permission to delete this entity');
    }

    return this.entitiesService.remove(id);
  }

  @Get('hierarchy/valid-parents')
  @ApiOperation({ summary: 'Get valid parent entities for a given type' })
  @ApiQuery({ name: 'type', enum: ['PLATFORM', 'UNION', 'ASSOCIATION', 'FIELD'], required: true })
  @ApiResponse({ status: 200, description: 'List of valid parent entities' })
  async getValidParentsByQuery(@Query('type') typeStr?: string) {
    if (!typeStr) {
      throw new BadRequestException('Query param "type" is required');
    }
    const type = this.parseType(typeStr);
    return this.entitiesService.findValidParentsForType(type);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get direct child entities of a parent entity' })
  @ApiResponse({ status: 200, description: 'List of direct child entities' })
  async getChildren(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.entitiesService.findChildren(id);
  }

  @Get(':id/descendants')
  @ApiOperation({ summary: 'Get all descendant entities recursively (BFS)' })
  @ApiResponse({ status: 200, description: 'Flat list of all descendant entities' })
  async getDescendants(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.entitiesService.findDescendants(id);
  }

  @Get(':id/tree')
  @ApiOperation({ summary: 'Get entity hierarchy as nested tree structure' })
  @ApiResponse({ status: 200, description: 'Nested tree with children at each level' })
  async getHierarchyTree(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.entitiesService.getHierarchyTree(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate an entity' })
  @ApiResponse({ status: 200, description: 'Entity deactivated' })
  async deactivate(@Req() req: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    const entity = await this.entitiesService.findOne(id);
    const ability = (req as any).ability as AppAbility;

    if (!ability.can(Action.Update, entity)) {
      throw new ForbiddenException('You do not have permission to deactivate this entity');
    }

    return this.entitiesService.update(id, { is_active: false });
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate an entity' })
  @ApiResponse({ status: 200, description: 'Entity activated' })
  async activate(@Req() req: Request, @Param('id', new ParseUUIDPipe()) id: string) {
    const entity = await this.entitiesService.findOne(id);
    const ability = (req as any).ability as AppAbility;

    if (!ability.can(Action.Update, entity)) {
      throw new ForbiddenException('You do not have permission to activate this entity');
    }

    return this.entitiesService.update(id, { is_active: true });
  }
}

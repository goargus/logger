import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/types';
import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { EntityType, Entity } from './entity.entity';

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
  async findAll() {
    return this.entitiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.entitiesService.findOne(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, Entity))
  async update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateEntityDto) {
    return this.entitiesService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, Entity))
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.entitiesService.remove(id);
  }

  @Get('hierarchy/valid-parents')
  async getValidParentsByQuery(@Query('type') typeStr?: string) {
    if (!typeStr) {
      throw new BadRequestException('Query param "type" is required');
    }
    const type = this.parseType(typeStr);
    return this.entitiesService.findValidParentsForType(type);
  }

  @Get(':id/children')
  async getChildren(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.entitiesService.findChildren(id);
  }

  @Patch(':id/deactivate')
  @CheckPolicies((ability) => ability.can(Action.Update, Entity))
  async deactivate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.entitiesService.update(id, { is_active: false });
  }

  @Patch(':id/activate')
  @CheckPolicies((ability) => ability.can(Action.Update, Entity))
  async activate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.entitiesService.update(id, { is_active: true });
  }
}

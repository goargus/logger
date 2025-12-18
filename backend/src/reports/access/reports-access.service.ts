import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entity } from '../../entities/entity.entity';
import { User } from '../../users/user.entity';

@Injectable()
export class ReportsAccessService {
  constructor(
    @InjectRepository(Entity)
    private readonly entityRepo: Repository<Entity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getEntityHierarchy(entityId: string): Promise<string[]> {
    const entity = await this.entityRepo.findOne({
      where: { id: entityId },
      relations: ['children'],
    });

    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    const entityIds = [entityId];
    const queue = [entity];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      const children = await this.entityRepo.find({
        where: { parent_id: current.id },
        relations: ['children'],
      });

      for (const child of children) {
        entityIds.push(child.id);
        queue.push(child);
      }
    }

    return entityIds;
  }

  async validateEntityInUserScope(actorUserId: string, targetEntityId: string): Promise<boolean> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });

    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const allowedEntityIds = await this.getEntityHierarchy(actor.entity_id);
    return allowedEntityIds.includes(targetEntityId);
  }

  async validateUserInScope(actorUserId: string, targetUserId: string): Promise<boolean> {
    const actor = await this.userRepo.findOne({
      where: { id: actorUserId },
      relations: ['entity'],
    });
    const target = await this.userRepo.findOne({
      where: { id: targetUserId },
      relations: ['entity'],
    });

    if (!actor || !target) {
      throw new NotFoundException('User not found');
    }

    const allowedEntityIds = await this.getEntityHierarchy(actor.entity_id);
    return allowedEntityIds.includes(target.entity_id);
  }
}

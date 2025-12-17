import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslAbilityFactory } from './casl-ability.factory';
import { PoliciesGuard } from './policies.guard';
import { UserRoleAssignment } from '../roles/user-role-assignment.entity';
import { Entity } from '../entities/entity.entity';

/**
 * CASL Module
 * Provides authorization services using CASL abilities
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserRoleAssignment, Entity])],
  providers: [CaslAbilityFactory, PoliciesGuard],
  exports: [CaslAbilityFactory, PoliciesGuard],
})
export class CaslModule {}

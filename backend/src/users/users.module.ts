import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { Entity as OrgEntity } from '../entities/entity.entity';
import { EntitiesService } from '../entities/entities.service';
import { RolesService } from '../roles/roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, OrgEntity]), EntitiesService, RolesService],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

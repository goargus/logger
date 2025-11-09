import {
  Entity as OrmEntity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from './role.entity';
import { Entity as OrgEntity } from '../entities/entity.entity';

@OrmEntity({ name: 'user_role_assignments' })
@Unique(['user', 'role', 'entity'])
export class UserRoleAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Role, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => OrgEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entity_id' })
  entity!: OrgEntity;

  @Column({ type: 'varchar', length: 120, nullable: true })
  created_by?: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  updated_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

import {
  Entity as OrmEntity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from './role.entity';
import { Entity as OrgEntity } from '../entities/entity.entity';
import { getCurrentDateString } from '../common/date.utils';

@OrmEntity({ name: 'user_role_assignments' })
@Index(['user', 'end_date'])
@Index(['entity', 'end_date'])
@Index(['user', 'role', 'entity', 'start_date', 'end_date'])
export class UserRoleAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => OrgEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entity_id' })
  entity!: OrgEntity;

  @Column({ type: 'date', name: 'start_date' })
  start_date!: string;

  @Column({ type: 'date', name: 'end_date' })
  end_date!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  created_by?: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  updated_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  isActive(): boolean {
    const today = getCurrentDateString();
    return this.end_date >= today;
  }
}

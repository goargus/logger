import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string | null;

  @Column({ type: 'boolean', default: false, name: 'can_view_reports' })
  canViewReports!: boolean;

  @Column({ type: 'boolean', default: false, name: 'can_manage_own_activities' })
  canManageOwnActivities!: boolean;

  @Column({ type: 'boolean', default: false, name: 'can_manage_hierarchy_activities' })
  canManageHierarchyActivities!: boolean;

  @Column({ type: 'boolean', default: false, name: 'can_manage_entities' })
  canManageEntities!: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_system_admin' })
  isSystemAdmin!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}

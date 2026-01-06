import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { RolePermission } from './role-permission.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];

  @OneToMany(() => RolePermission, (rp) => rp.role, { cascade: true })
  rolePermissions!: RolePermission[];

  /**
   * Helper getter to extract permission strings from rolePermissions relation.
   * Requires rolePermissions to be loaded via relations.
   */
  get permissions(): string[] {
    return this.rolePermissions?.map((rp) => rp.permission) || [];
  }
}

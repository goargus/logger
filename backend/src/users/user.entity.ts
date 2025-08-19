import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { UserStatus } from './user-status.enum';
import { Role } from '../roles/role.entity';
import { Entity as OrgEntity } from '../entities/entity.entity';

@Entity({ name: 'user' })
@Check(`status IN ('active','suspended','archived')`)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', nullable: false })
  username!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', nullable: false })
  email!: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  archived_at?: Date | null;

  @Column({ type: 'text', nullable: true })
  full_name?: string | null;

  @Column({ type: 'text', nullable: true })
  first_name!: string | null;

  @Column({ type: 'text', nullable: true })
  family_name!: string | null;

  @ManyToOne(() => Role, (r) => r.users, { nullable: false, eager: true })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ type: 'uuid' })
  role_id!: string;

  @ManyToOne(() => OrgEntity, (e) => e.users, { nullable: false, eager: true })
  @JoinColumn({ name: 'entity_id' })
  entity!: OrgEntity;

  @Column({ type: 'uuid' })
  entity_id!: string;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Entity as OrganizationalEntity } from '../entities/entity.entity';

@Entity({ name: 'admin_lock' })
@Unique(['entityId'])
export class AdminLock {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId!: string;

  @ManyToOne(() => OrganizationalEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entity_id' })
  entity!: OrganizationalEntity;

  @Column({ type: 'date', name: 'lock_date' })
  lockDate!: string;

  @Column({ type: 'uuid', name: 'locked_by' })
  lockedBy!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'locked_at' })
  lockedAt!: Date;
}

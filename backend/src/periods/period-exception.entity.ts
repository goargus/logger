import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Entity as OrganizationalEntity } from '../entities/entity.entity';

@Entity({ name: 'period_exception' })
@Unique(['userId', 'entityId', 'startDate', 'endDate'])
export class PeriodException {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId!: string;

  @ManyToOne(() => OrganizationalEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entity_id' })
  entity!: OrganizationalEntity;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: string;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ type: 'uuid', name: 'granted_by' })
  grantedBy!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'granted_at' })
  grantedAt!: Date;
}

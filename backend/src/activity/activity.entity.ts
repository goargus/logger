import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ActivityStatus } from './activity-status.enum';
import { User } from '../users/user.entity';
import { ActivityType } from '../activities-type/activity-type.entity';

@Entity({ name: 'activity' })
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'activity_type_id' })
  activityTypeId!: string;

  @ManyToOne(() => ActivityType, { eager: false, nullable: false })
  @JoinColumn({ name: 'activity_type_id' })
  activityType!: ActivityType;

  @Column({ type: 'date', name: 'activity_date' })
  activityDate!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'boolean', name: 'has_expense', default: false })
  hasExpense!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'expense_amount', nullable: true })
  expenseAmount?: string | null;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { eager: false, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy!: string;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'uuid', name: 'updated_by' })
  updatedBy!: string;

  @Column({ type: 'enum', enum: ActivityStatus, default: ActivityStatus.ACTIVE })
  status!: ActivityStatus;

  @Column({ type: 'timestamptz', name: 'archived_at', nullable: true })
  archivedAt?: Date | null;

  @Column({ type: 'uuid', name: 'archived_by', nullable: true })
  archivedBy?: string | null;
}

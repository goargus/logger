import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ReportingPeriod } from './reporting-period.entity';

@Entity({ name: 'reporting_period_exception' })
@Unique(['user', 'reportingPeriod'])
export class ReportingPeriodException {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { eager: false, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'uuid', name: 'reporting_period_id' })
  reportingPeriodId!: string;

  @ManyToOne(() => ReportingPeriod, { eager: false, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporting_period_id' })
  reportingPeriod!: ReportingPeriod;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: string;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ type: 'uuid', name: 'granted_by' })
  grantedBy!: string;

  @ManyToOne(() => User, { eager: false, nullable: false })
  @JoinColumn({ name: 'granted_by' })
  grantedByUser!: User;

  @CreateDateColumn({ type: 'timestamptz', name: 'granted_at' })
  grantedAt!: Date;
}

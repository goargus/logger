import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  Check,
} from 'typeorm';
import { ReportingPeriodStatus } from './reporting-period-status.enum';
import { Activity } from '../activity/activity.entity';

@Entity({ name: 'reporting_period' })
@Check(`status IN ('active','locked')`)
@Index(['start_date', 'end_date'])
export class ReportingPeriod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date' })
  endDate!: string;

  @Column({ type: 'enum', enum: ReportingPeriodStatus, default: ReportingPeriodStatus.ACTIVE })
  status!: ReportingPeriodStatus;

  @OneToMany(() => Activity, (activity) => activity.reportingPeriod)
  activities!: Activity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy!: string;

  @Column({ type: 'uuid', name: 'updated_by' })
  updatedBy!: string;

  get isLocked(): boolean {
    return this.status === ReportingPeriodStatus.LOCKED;
  }

  containsDate(date: string): boolean {
    return date >= this.startDate && date <= this.endDate;
  }
}

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
import { ReportingPeriodStatus } from './reporting-period-status.enum';
import { Entity as OrganizationalEntity } from '../entities/entity.entity';

@Entity({ name: 'reporting_period' })
@Check(`status IN ('active','locked')`)
@Index(['startDate', 'endDate'])
@Index(['entityId', 'status'])
@Index('idx_one_active_per_entity', ['entityId', 'status'], {
  unique: true,
  where: "status = 'active'",
})
export class ReportingPeriod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'entity_id', nullable: false })
  entityId!: string;

  @ManyToOne(() => OrganizationalEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entity_id' })
  entity!: OrganizationalEntity;

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

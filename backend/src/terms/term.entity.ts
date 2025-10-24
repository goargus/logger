import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Entity as OrganizationalEntity } from '../entities/entity.entity';

@Entity('terms')
@Index(['entity_id', 'is_active'], { where: 'is_active = true' })
export class Term {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  entity_id!: string;

  @ManyToOne(() => OrganizationalEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entity_id' })
  entity!: OrganizationalEntity;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'date' })
  start_date!: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date;

  @Column({ default: false })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
  JoinTable,
  Check,
} from 'typeorm';
import { Role } from '../roles/role.entity';

export enum GrowthDirection {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
}

@Entity({ name: 'activity_type' })
@Check(`name <> ''`)
@Check(`description <> ''`)
export class ActivityType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: false })
  description!: string;

  @Column({
    type: 'enum',
    enum: GrowthDirection,
    default: GrowthDirection.POSITIVE,
  })
  growth_direction!: GrowthDirection;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'activity_type_role',
    joinColumn: { name: 'activity_type_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  allowed_roles!: Role[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

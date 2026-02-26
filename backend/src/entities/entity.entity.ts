import {
  Entity as OrmEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum EntityType {
  PLATFORM = 'PLATFORM',
  UNION = 'UNION',
  ASSOCIATION = 'ASSOCIATION',
  FIELD = 'FIELD',
}

@OrmEntity('entities')
@Unique(['name', 'type'])
@Check('term_length_years >= 1 AND term_length_years <= 20')
export class Entity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 80 })
  name!: string;

  @Column({ type: 'enum', enum: EntityType })
  type!: EntityType;

  @Column({ length: 6, nullable: true })
  code?: string;

  @Column({ length: 500, nullable: true })
  description?: string;

  @Column({ length: 255, nullable: true })
  location?: string;

  @Column({ length: 10, nullable: true, name: 'currency_symbol' })
  currency_symbol?: string;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'int', default: 5, name: 'term_length_years' })
  term_length_years!: number;

  @Column({ type: 'uuid', nullable: true })
  parent_id?: string | null;

  @ManyToOne(() => Entity, (entity) => entity.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Entity;

  @OneToMany(() => Entity, (entity) => entity.parent)
  children!: Entity[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => User, (user) => user.entity)
  users!: User[];
}

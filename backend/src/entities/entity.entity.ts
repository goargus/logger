import {
  Entity as OrmEntity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
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

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => User, (user) => user.entity)
  users!: User[];
}

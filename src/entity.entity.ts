// src/entities/entity.entity.ts

import {
    Entity as OrmEntity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  export enum EntityType {
    UNION = 'UNION',
    ASSOCIATION = 'ASSOCIATION',
    FIELD = 'FIELD',
  }
  
  @OrmEntity()
  export class Entity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    name: string;
  
    @Column({
      type: 'enum',
      enum: EntityType,
    })
    type: EntityType;
  
    @Column({ nullable: true })
    parent_id: string;
  
    @Column()
    code: string;
  
    @Column({ nullable: true })
    location: string;
  
    @Column({ default: true })
    is_active: boolean;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }
  
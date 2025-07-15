import {
  Entity as OrmEntity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { IsEnum, IsOptional, IsString } from "class-validator";

export enum EntityType {
  UNION = "UNION",
  ASSOCIATION = "ASSOCIATION",
  FIELD = "FIELD",
}

@OrmEntity("entity")
export class Entity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  @IsString()
  name!: string;

  @Column({ type: "enum", enum: EntityType })
  @IsEnum(EntityType)
  type!: EntityType;

  @ManyToOne(() => Entity, { nullable: true })
  parent!: Entity | null;

  @Column({ unique: true, nullable: true })
  @IsOptional()
  @IsString()
  code!: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

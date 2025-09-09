import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { EntityType } from "../entity.entity";

export class CreateEntityDto {
  @IsString()
  name!: string;

  @IsEnum(EntityType)
  type!: EntityType;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;
}

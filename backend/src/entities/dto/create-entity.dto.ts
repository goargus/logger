import { IsEnum, IsOptional, IsString } from "class-validator";
import { EntityType } from "../entity.entity";

export class CreateEntityDto {
  @IsString()
  name!: string;

  @IsEnum(EntityType)
  type!: EntityType;

  @IsOptional()
  @IsString()
  parentId!: string | null;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  location?: string;
}

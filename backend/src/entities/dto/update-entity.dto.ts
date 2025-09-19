import { IsOptional, IsEnum, IsString, IsUUID, IsBoolean } from "class-validator";
import { EntityType } from "../entity.entity";

export class UpdateEntityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(EntityType)
  type?: EntityType;

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

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

import { IsOptional, IsEnum, IsString } from "class-validator";
import { EntityType } from "../entity.entity";

export class UpdateEntityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(EntityType)
  type?: EntityType;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  is_active?: boolean;
}

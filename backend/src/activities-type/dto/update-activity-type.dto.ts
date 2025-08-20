import { IsArray, IsOptional, IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class UpdateActivityTypeDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;

  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  role_ids?: string[];
}

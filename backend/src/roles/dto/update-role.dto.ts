import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

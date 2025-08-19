import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { UserStatus } from '../user-status.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  role_id?: string;

  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  family_name?: string;
}

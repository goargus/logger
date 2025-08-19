import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username!: string;

  @IsEmail()
  email!: string;

  @IsUUID()
  role_id!: string;

  @IsUUID()
  entity_id!: string;

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

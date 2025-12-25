import { IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RoleEnum {
  ADMIN = 'ADMIN',
  MISSIONARY = 'MISSIONARY',
  PASTOR = 'PASTOR',
  MINISTER = 'MINISTER',
  EXECUTIVE = 'EXECUTIVE',
  DEPARTMENTAL = 'DEPARTMENTAL',
}

export class AssignRoleDto {
  @ApiProperty({
    description: 'UUID of the user to assign the role to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Role to assign',
    enum: RoleEnum,
    example: 'MISSIONARY',
  })
  @Transform(({ value }) => String(value).trim().toUpperCase())
  @IsEnum(RoleEnum, {
    message: 'Invalid role enum value. Allowed: ADMIN, MISSIONARY, PASTOR, MINISTER, EXECUTIVE, DEPARTMENTAL',
  })
  role!: RoleEnum;

  @ApiProperty({
    description: 'UUID of the entity where the role applies',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  entityId!: string;

  @ApiPropertyOptional({
    description: 'Start date for the role assignment',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}

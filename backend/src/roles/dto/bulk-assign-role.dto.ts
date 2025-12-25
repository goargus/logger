import { IsUUID, IsEnum, IsArray, ArrayNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { RoleEnum } from './assign-role.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkAssignRoleDto {
  @ApiProperty({
    description: 'UUID of the user to assign roles to',
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
    description: 'Array of entity UUIDs to assign the role for',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  entityIds!: string[];

  @ApiPropertyOptional({
    description: 'Start date for all assignments',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}

import { IsUUID, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { RoleEnum } from './assign-role.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetUserEntitiesByRoleDto {
  @ApiProperty({
    description: 'UUID of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Role to filter by',
    enum: RoleEnum,
    example: 'MISSIONARY',
  })
  @Transform(({ value }) => String(value).trim().toUpperCase())
  @IsEnum(RoleEnum, {
    message: 'Invalid role enum value. Allowed: ADMIN, MISSIONARY, PASTOR, MINISTER, EXECUTIVE, DEPARTMENTAL',
  })
  role!: RoleEnum;
}

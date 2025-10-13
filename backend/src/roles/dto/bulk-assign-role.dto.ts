import { IsUUID, IsEnum, IsArray, ArrayNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { RoleEnum } from './assign-role.dto';

export class BulkAssignRoleDto {
  @IsUUID()
  userId!: string;

  @Transform(({ value }) => String(value).trim().toUpperCase())
  @IsEnum(RoleEnum, {
    message: 'Invalid role enum value. Allowed: ADMIN, MISSIONARY, PASTOR, MINISTER, EXECUTIVE',
  })
  role!: RoleEnum;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  entityIds!: string[];
}

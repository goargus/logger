import { IsUUID, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { RoleEnum } from './assign-role.dto';

export class GetUserEntitiesByRoleDto {
  @IsUUID()
  userId!: string;

  @Transform(({ value }) => String(value).trim().toUpperCase())
  @IsEnum(RoleEnum, {
    message: 'Invalid role enum value. Allowed: ADMIN, MISSIONARY, PASTOR, MINISTER, EXECUTIVE',
  })
  role!: RoleEnum;
}

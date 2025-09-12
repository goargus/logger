import { IsUUID, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum RoleEnum {
  ADMIN = 'ADMIN',
  MISSIONARY = 'MISSIONARY',
  PASTOR = 'PASTOR',
  MINISTER = 'MINISTER',
  EXECUTIVE = 'EXECUTIVE',
}

export class AssignRoleDto {
  @IsUUID()
  userId!: string;

  @Transform(({ value }) => String(value).trim().toUpperCase())
  @IsEnum(RoleEnum, {
    message: 'Invalid role enum value. Allowed: ADMIN, MISSIONARY, PASTOR, MINISTER, EXECUTIVE',
  })
  role!: RoleEnum;

  @IsUUID()
  entityId!: string;
}

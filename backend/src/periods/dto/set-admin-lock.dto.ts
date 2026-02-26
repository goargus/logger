import { IsUUID, IsDateString } from 'class-validator';

export class SetAdminLockDto {
  @IsUUID()
  entityId!: string;

  @IsDateString()
  lockDate!: string;
}

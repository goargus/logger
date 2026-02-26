import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';

export class GrantExceptionDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  entityId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

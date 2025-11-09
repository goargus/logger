import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateExceptionDto {
  @IsUUID()
  userId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

import { IsString, IsUUID, IsDateString, IsOptional } from 'class-validator';

export class CreateTermDto {
  @IsUUID()
  entity_id!: string;

  @IsString()
  name!: string;

  @IsDateString()
  start_date!: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

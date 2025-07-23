import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class UpdateActivityDto {
  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsOptional()
  description?: string;
}
